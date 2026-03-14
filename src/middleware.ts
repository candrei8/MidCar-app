import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Type for cookie operations
type CookieToSet = { name: string; value: string; options: CookieOptions }

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/inventario', '/contactos', '/crm', '/seguro', '/contratos']

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

    // Check if current route is protected
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    )

    // Check if current route is an auth route (login/registro)
    const isAuthRoute = authRoutes.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    )

    // SECURITY: For protected routes, use getUser() which validates with Supabase server
    // This prevents bypassing auth with stale/fake cookies
    if (isProtectedRoute) {
        const { data: { user }, error } = await supabase.auth.getUser()

        // If no valid user or error, force redirect to login
        if (error || !user) {
            // Clear any stale auth cookies
            const loginUrl = new URL('/login', request.url)
            loginUrl.searchParams.set('redirect', pathname)

            const redirectResponse = NextResponse.redirect(loginUrl)
            // Clear auth cookies to prevent cache issues
            redirectResponse.cookies.delete('sb-access-token')
            redirectResponse.cookies.delete('sb-refresh-token')

            return redirectResponse
        }

        // Add cache-control headers to prevent caching of protected pages
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')

        return response
    }

    // For auth routes, use getSession() (faster, reads from cookies)
    // It's OK if stale session redirects to dashboard - user will see login required
    if (isAuthRoute) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // Handle root path
    if (pathname === '/') {
        const { data: { user } } = await supabase.auth.getUser()
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
