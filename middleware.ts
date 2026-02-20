import { NextResponse, type NextRequest } from 'next/server'

/**
 * Root-level Next.js middleware
 * Handles:
 * 1. SUPER_ADMIN route protection
 * 2. company_id enforcement for tenant routes
 * 3. Company ACTIVE status check
 */

// Routes that bypass auth entirely
const PUBLIC_PATHS = [
    '/login',
    '/register-company',
    '/forgot-password',
    '/reset-password',
    '/api/auth/login',         // Public: Initial login
    '/api/auth/mfa/validate',  // Public: 2nd step login (uses temp token in body)
    '/api/registration',
    '/_next/',
    '/favicon.ico',
]

// Routes requiring SUPER_ADMIN role
const SUPER_ADMIN_PATHS = [
    '/super-admin',
    '/api/super-admin/',
]

function decodeJWT(token: string): { id: number; role: string; company_id: number | null } | null {
    try {
        const base64 = token.split('.')[1]
        const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
        const payload = JSON.parse(json)
        return {
            id: payload.id,
            role: payload.role,
            company_id: payload.company_id ?? null,
        }
    } catch {
        return null
    }
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. Allow public paths
    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
        return NextResponse.next()
    }

    // 2. Allow static assets and root page
    if (pathname === '/' || pathname.startsWith('/_next') || pathname.includes('.')) {
        return NextResponse.next()
    }

    // 3. Extract token from cookie or Authorization header
    const cookieToken = request.cookies.get('token')?.value
    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    const token = cookieToken || bearerToken

    if (!token) {
        // API routes return 401, page routes redirect to login
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/login', request.url))
    }

    const decoded = decodeJWT(token)
    if (!decoded) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 4. SUPER_ADMIN route protection
    const isSuperAdminRoute = SUPER_ADMIN_PATHS.some(p => pathname.startsWith(p))
    if (isSuperAdminRoute && decoded.role !== 'SUPER_ADMIN') {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ message: 'Forbidden: SUPER_ADMIN only' }, { status: 403 })
        }
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 4b. SUPER_ADMIN should NOT access tenant pages — redirect to their panel
    //     They can only use /super-admin/*, /api/super-admin/*, /api/auth/*, and /api/admin/users
    if (decoded.role === 'SUPER_ADMIN') {
        const allowedForSuperAdmin = [
            '/super-admin',
            '/api/super-admin',
            '/api/auth',
            '/api/admin/users',
            '/profile',
            '/api/profile'
        ]
        const isAllowed = allowedForSuperAdmin.some(p => pathname.startsWith(p))
        if (!isAllowed) {
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ message: 'SUPER_ADMIN cannot access tenant data' }, { status: 403 })
            }
            return NextResponse.redirect(new URL('/super-admin', request.url))
        }
    }

    // 5. Enforce company_id for tenant API routes (non-SUPER_ADMIN)
    //    For page routes, allow through (they'll see limited data)
    if (decoded.role !== 'SUPER_ADMIN' && pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
        if (decoded.company_id === null || decoded.company_id === undefined) {
            return NextResponse.json({ message: 'No company associated with account' }, { status: 403 })
        }
    }

    // 6. Forward decoded user info as headers for API routes
    // 6. Forward decoded user info as headers for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', String(decoded.id))
    requestHeaders.set('x-user-role', decoded.role)
    if (decoded.company_id !== null) {
        requestHeaders.set('x-company-id', String(decoded.company_id))
    }

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
