import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Type for cookie operations
type CookieToSet = { name: string; value: string; options: CookieOptions }

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/inventario', '/contactos', '/crm', '/seguro']

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/registro']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const isSupabaseConfigured = Boolean(
        supabaseUrl &&
        supabaseAnonKey &&
        !supabaseUrl.includes('placeholder')
    )

    // SECURITY: If Supabase is not configured, block access to protected routes
    // Only allow access to the configuration error page and static assets
    if (!isSupabaseConfigured) {
        const isProtectedRoute = protectedRoutes.some(route =>
            pathname === route || pathname.startsWith(`${route}/`)
        )

        // If trying to access protected routes without Supabase configured, redirect to error page
        if (isProtectedRoute) {
            return NextResponse.redirect(new URL('/error/configuracion', request.url))
        }

        // Allow access to login, registro, and error pages (they will show appropriate messages)
        return NextResponse.next()
    }

    // Create Supabase client for server-side auth check
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        supabaseUrl!,
        supabaseAnonKey!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: CookieToSet[]) {
                    cookiesToSet.forEach(({ name, value }) => {
                        request.cookies.set(name, value)
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // Get user session - use getSession() instead of getUser() for performance
    // getSession() reads from cookies locally, getUser() makes a network request
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null

    // Check if current route is protected
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    )

    // Check if current route is an auth route (login/registro)
    const isAuthRoute = authRoutes.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    )

    // If trying to access protected route without auth, redirect to login
    if (isProtectedRoute && !user) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // If trying to access auth routes while already authenticated, redirect to dashboard
    if (isAuthRoute && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Handle root path
    if (pathname === '/') {
        if (user) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        } else {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * - api routes
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
    ],
}
