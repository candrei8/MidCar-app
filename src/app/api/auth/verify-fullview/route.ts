import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Rate limiting simple en memoria (en producción usar Redis)
const attempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutos

function getRateLimitKey(request: NextRequest): string {
    // Usar IP o un identificador del request
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return ip
}

function checkRateLimit(key: string): { allowed: boolean; remainingAttempts: number } {
    const now = Date.now()
    const record = attempts.get(key)

    if (!record) {
        return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
    }

    // Reset si pasó el tiempo de lockout
    if (now - record.lastAttempt > LOCKOUT_DURATION) {
        attempts.delete(key)
        return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
    }

    if (record.count >= MAX_ATTEMPTS) {
        return { allowed: false, remainingAttempts: 0 }
    }

    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.count }
}

function recordAttempt(key: string, success: boolean): void {
    if (success) {
        // Reset en éxito
        attempts.delete(key)
        return
    }

    const now = Date.now()
    const record = attempts.get(key)

    if (!record) {
        attempts.set(key, { count: 1, lastAttempt: now })
    } else {
        record.count += 1
        record.lastAttempt = now
    }
}

export async function POST(request: NextRequest) {
    try {
        // Verificar rate limiting
        const rateLimitKey = getRateLimitKey(request)
        const { allowed, remainingAttempts } = checkRateLimit(rateLimitKey)

        if (!allowed) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Demasiados intentos fallidos. Espera 15 minutos.',
                    locked: true
                },
                { status: 429 }
            )
        }

        // Parsear body
        const body = await request.json()
        const { code } = body

        if (!code || typeof code !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Código requerido' },
                { status: 400 }
            )
        }

        // Obtener el código secreto desde variable de entorno del servidor
        // IMPORTANTE: Esta variable NO tiene prefijo NEXT_PUBLIC_
        // por lo que NUNCA se expone al cliente
        const FULL_VIEW_SECRET = process.env.FULL_VIEW_ACCESS_CODE

        if (!FULL_VIEW_SECRET) {
            console.error('FULL_VIEW_ACCESS_CODE no está configurado en las variables de entorno')
            return NextResponse.json(
                { success: false, error: 'Error de configuración del servidor' },
                { status: 500 }
            )
        }

        // Comparación segura con timing constante para prevenir timing attacks
        const isValid = code.length === FULL_VIEW_SECRET.length &&
            timingSafeEqual(code, FULL_VIEW_SECRET)

        // Registrar intento
        recordAttempt(rateLimitKey, isValid)

        if (isValid) {
            // Opcionalmente: verificar que el usuario esté autenticado
            const authHeader = request.headers.get('authorization')
            if (authHeader) {
                // Verificar token con Supabase si está disponible
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
                const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

                if (supabaseUrl && supabaseKey) {
                    const supabase = createClient(supabaseUrl, supabaseKey)
                    const token = authHeader.replace('Bearer ', '')
                    const { data: { user } } = await supabase.auth.getUser(token)

                    if (!user) {
                        return NextResponse.json(
                            { success: false, error: 'Sesión inválida' },
                            { status: 401 }
                        )
                    }
                }
            }

            return NextResponse.json({
                success: true,
                message: 'Acceso concedido'
            })
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Código incorrecto',
                    remainingAttempts: remainingAttempts - 1
                },
                { status: 401 }
            )
        }
    } catch (error) {
        console.error('Error en verify-fullview:', error)
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

// Comparación de strings con tiempo constante para prevenir timing attacks
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return result === 0
}
