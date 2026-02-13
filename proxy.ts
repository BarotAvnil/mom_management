import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET
)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Allow public routes (auth, static files, images)
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public') ||
    pathname === '/login' ||
    pathname === '/register'
  ) {
    return NextResponse.next()
  }

  // 2. Get token from Cookies (preferred) or Header
  const tokenCookie = request.cookies.get('token')
  let token = tokenCookie?.value

  // Fallback to Header (for API testing tools)
  const authHeader = request.headers.get('authorization')
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  }

  // 3. Verify Token
  if (!token) {
    // If accessing API, return 401
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    // If accessing page, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { payload } = await jwtVerify(token, secret)
    const role = payload.role as string

    // 4. Role-Based Access Control
    // Admin-only routes
    const adminRoutes = ['/staff', '/reports', '/meeting-types']
    if (adminRoutes.some(route => pathname.startsWith(route)) && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Add user info to headers for downstream access if needed
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.id as string)
    requestHeaders.set('x-user-role', payload.role as string)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
