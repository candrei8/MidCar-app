import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { buildMerchantFeed, recordFeedRun } from '@/lib/feed-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
/** This is the heavy path — needs more than the default 10 s on cold start. */
export const maxDuration = 60

interface AuthOk {
    ok: true
    actor: string
}
interface AuthFail {
    ok: false
    status: number
    error: string
}
type AuthResult = AuthOk | AuthFail

/**
 * Accepts either:
 *  1. `Authorization: Bearer <FEED_REGENERATE_SECRET>` — used by the cron / external triggers.
 *  2. `Authorization: Bearer <supabase_jwt>` — used by signed-in CRM users.
 */
async function authenticate(request: NextRequest): Promise<AuthResult> {
    const header = request.headers.get('authorization') || ''
    const token = header.replace(/^Bearer\s+/i, '').trim()

    if (!token) {
        return { ok: false, status: 401, error: 'Missing Authorization header' }
    }

    const secret = process.env.FEED_REGENERATE_SECRET
    if (secret && token === secret) {
        return { ok: true, actor: 'cron' }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnon) {
        return { ok: false, status: 500, error: 'Supabase env not configured' }
    }

    try {
        const sb = createClient(supabaseUrl, supabaseAnon, {
            auth: { persistSession: false, autoRefreshToken: false },
        })
        const { data, error } = await sb.auth.getUser(token)
        if (error || !data?.user) {
            return { ok: false, status: 401, error: 'Invalid session token' }
        }
        return { ok: true, actor: `user:${data.user.id}` }
    } catch {
        return { ok: false, status: 401, error: 'Token validation failed' }
    }
}

export async function POST(request: NextRequest) {
    const auth = await authenticate(request)
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    try {
        const { itemCount, generatedAt } = await buildMerchantFeed()

        // Bust the CDN cache on the public feed endpoint.
        try {
            revalidatePath('/api/feeds/merchant.xml')
        } catch (err) {
            console.warn('revalidatePath failed (non-fatal):', err)
        }

        await recordFeedRun({
            status: 'ok',
            itemCount,
            triggeredBy: `manual:${auth.actor}`,
        })

        return NextResponse.json({
            success: true,
            itemCount,
            generatedAt,
            triggeredBy: auth.actor,
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Manual feed regenerate failed:', error)

        await recordFeedRun({
            status: 'error',
            errorMessage: message,
            triggeredBy: `manual:${auth.actor}`,
        })

        return NextResponse.json(
            { error: 'Feed regeneration failed', details: message },
            { status: 500 }
        )
    }
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    })
}

// GET returns the current feed_metadata status so the UI can poll.
export async function GET(request: NextRequest) {
    const auth = await authenticate(request)
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { getFeedMetadata } = await import('@/lib/feed-service')
    const metadata = await getFeedMetadata('merchant')
    return NextResponse.json({ metadata })
}
