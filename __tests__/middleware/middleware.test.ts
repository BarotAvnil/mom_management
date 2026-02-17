/**
 * Middleware Tests
 * Covers: Root-level Next.js middleware
 * - Public route bypass
 * - Token extraction (cookie + Authorization header)
 * - Invalid/missing token handling
 * - SUPER_ADMIN route protection
 * - SUPER_ADMIN tenant isolation
 * - company_id enforcement for tenant routes
 * - Header forwarding
 */

import { middleware } from '@/middleware'
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const TEST_SECRET = 'test-jwt-secret-key-for-testing'
process.env.JWT_SECRET = TEST_SECRET

function createToken(payload: object): string {
    return jwt.sign(payload, TEST_SECRET, { expiresIn: '1d' })
}

function makeNextRequest(path: string, options: { token?: string; cookie?: boolean; method?: string } = {}): NextRequest {
    const url = `http://localhost:3000${path}`
    const req = new NextRequest(url, { method: options.method || 'GET' })

    if (options.token) {
        if (options.cookie !== false) {
            req.cookies.set('token', options.token)
        } else {
            // Use Authorization header
            const headers = new Headers(req.headers)
            headers.set('authorization', `Bearer ${options.token}`)
            return new NextRequest(url, { method: options.method || 'GET', headers })
        }
    }

    return req
}

describe('Middleware', () => {
    // ─── Public Route Bypass ───────────────────────────
    describe('Public routes', () => {
        const publicPaths = ['/login', '/register-company', '/forgot-password', '/reset-password', '/api/auth/login', '/api/registration']

        publicPaths.forEach((path) => {
            it(`allows ${path} without auth`, () => {
                const req = makeNextRequest(path)
                const res = middleware(req)

                expect(res.status).not.toBe(401)
                expect(res.status).not.toBe(403)
            })
        })

        it('allows root page /', () => {
            const req = makeNextRequest('/')
            const res = middleware(req)

            expect(res.status).not.toBe(401)
        })
    })

    // ─── Missing Token ────────────────────────────────
    describe('Missing token', () => {
        it('returns 401 for API routes without token', () => {
            const req = makeNextRequest('/api/meetings')
            const res = middleware(req)

            expect(res.status).toBe(401)
        })

        it('redirects page routes to /login without token', () => {
            const req = makeNextRequest('/dashboard')
            const res = middleware(req)

            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('/login')
        })
    })

    // ─── Invalid Token ────────────────────────────────
    describe('Invalid token', () => {
        it('returns 401 for malformed token on API routes', () => {
            const req = makeNextRequest('/api/meetings', { token: 'garbage.token.data' })
            const res = middleware(req)

            expect(res.status).toBe(401)
        })

        it('redirects to login for malformed token on page routes', () => {
            const req = makeNextRequest('/dashboard', { token: 'bad.token' })
            const res = middleware(req)

            expect(res.status).toBe(307)
        })
    })

    // ─── SUPER_ADMIN Route Protection ─────────────────
    describe('SUPER_ADMIN route protection', () => {
        it('blocks COMPANY_ADMIN from /super-admin routes', () => {
            const token = createToken({ id: 10, role: 'COMPANY_ADMIN', company_id: 1 })
            const req = makeNextRequest('/super-admin/dashboard', { token })
            const res = middleware(req)

            // Should redirect to /dashboard
            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('/dashboard')
        })

        it('blocks MEMBER from /api/super-admin routes', () => {
            const token = createToken({ id: 20, role: 'MEMBER', company_id: 1 })
            const req = makeNextRequest('/api/super-admin/stats', { token })
            const res = middleware(req)

            expect(res.status).toBe(403)
        })

        it('allows SUPER_ADMIN to access /super-admin routes', () => {
            const token = createToken({ id: 1, role: 'SUPER_ADMIN', company_id: null })
            const req = makeNextRequest('/super-admin', { token })
            const res = middleware(req)

            expect(res.status).not.toBe(403)
            expect(res.status).not.toBe(401)
        })
    })

    // ─── SUPER_ADMIN Tenant Isolation ─────────────────
    describe('SUPER_ADMIN cannot access tenant routes', () => {
        it('blocks SUPER_ADMIN from /api/meetings', () => {
            const token = createToken({ id: 1, role: 'SUPER_ADMIN', company_id: null })
            const req = makeNextRequest('/api/meetings', { token })
            const res = middleware(req)

            expect(res.status).toBe(403)
        })

        it('blocks SUPER_ADMIN from /api/staff', () => {
            const token = createToken({ id: 1, role: 'SUPER_ADMIN', company_id: null })
            const req = makeNextRequest('/api/staff', { token })
            const res = middleware(req)

            expect(res.status).toBe(403)
        })

        it('blocks SUPER_ADMIN from /dashboard page (redirects to /super-admin)', () => {
            const token = createToken({ id: 1, role: 'SUPER_ADMIN', company_id: null })
            const req = makeNextRequest('/dashboard', { token })
            const res = middleware(req)

            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('/super-admin')
        })

        it('allows SUPER_ADMIN to access /api/auth routes', () => {
            const token = createToken({ id: 1, role: 'SUPER_ADMIN', company_id: null })
            const req = makeNextRequest('/api/auth/login', { token })
            const res = middleware(req)

            expect(res.status).not.toBe(403)
        })

        it('allows SUPER_ADMIN to access /api/profile', () => {
            const token = createToken({ id: 1, role: 'SUPER_ADMIN', company_id: null })
            const req = makeNextRequest('/api/profile', { token })
            const res = middleware(req)

            expect(res.status).not.toBe(403)
        })
    })

    // ─── company_id Enforcement ───────────────────────
    describe('company_id enforcement', () => {
        it('blocks tenant API access when user has no company_id', () => {
            const token = createToken({ id: 10, role: 'COMPANY_ADMIN', company_id: null })
            const req = makeNextRequest('/api/meetings', { token })
            const res = middleware(req)

            expect(res.status).toBe(403)
        })

        it('allows tenant API access when user has company_id', () => {
            const token = createToken({ id: 10, role: 'COMPANY_ADMIN', company_id: 1 })
            const req = makeNextRequest('/api/meetings', { token })
            const res = middleware(req)

            expect(res.status).not.toBe(401)
            expect(res.status).not.toBe(403)
        })
    })

    // ─── Header Forwarding ────────────────────────────
    describe('Header forwarding', () => {
        it('sets x-user-id, x-user-role, x-company-id headers', () => {
            const token = createToken({ id: 10, role: 'COMPANY_ADMIN', company_id: 1 })
            const req = makeNextRequest('/api/meetings', { token })
            const res = middleware(req)

            expect(res.headers.get('x-user-id')).toBe('10')
            expect(res.headers.get('x-user-role')).toBe('COMPANY_ADMIN')
            expect(res.headers.get('x-company-id')).toBe('1')
        })

        it('sets empty x-company-id for SUPER_ADMIN', () => {
            const token = createToken({ id: 1, role: 'SUPER_ADMIN', company_id: null })
            const req = makeNextRequest('/api/super-admin/stats', { token })
            const res = middleware(req)

            expect(res.headers.get('x-company-id')).toBe('')
        })
    })

    // ─── Token from Authorization Header ──────────────
    describe('Authorization header', () => {
        it('accepts token from Bearer header', () => {
            const token = createToken({ id: 10, role: 'COMPANY_ADMIN', company_id: 1 })
            const req = makeNextRequest('/api/meetings', { token, cookie: false })
            const res = middleware(req)

            expect(res.status).not.toBe(401)
        })
    })
})
