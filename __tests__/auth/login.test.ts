/**
 * Auth Login Tests
 * Covers: POST /api/auth/login
 * - Missing fields validation
 * - Invalid credentials
 * - Suspended company blocking
 * - Successful login with JWT
 */

jest.mock('bcryptjs')
jest.mock('jsonwebtoken')

import { POST } from '@/app/api/auth/login/route'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createRequest, makeUser, parseResponse } from '../helpers'

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>
const mockJwt = jwt as jest.Mocked<typeof jwt>

describe('POST /api/auth/login', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('returns 400 when email or password is missing', async () => {
        const req = createRequest({ method: 'POST', body: { email: '' } })
        const res = await POST(req)
        const { status, body } = await parseResponse(res)

        expect(status).toBe(400)
        expect(body.message).toBe('Email and password are required')
    })

    it('returns 401 when user does not exist', async () => {
        mockPrisma.users.findFirst.mockResolvedValue(null)

        const req = createRequest({ method: 'POST', body: { email: 'ghost@corp.com', password: 'pass' } })
        const res = await POST(req)
        const { status, body } = await parseResponse(res)

        expect(status).toBe(401)
        expect(body.message).toBe('Invalid credentials')
    })

    it('returns 401 when password is wrong', async () => {
        mockPrisma.users.findFirst.mockResolvedValue(makeUser() as any)
            ; (mockBcrypt.compare as jest.Mock).mockResolvedValue(false)

        const req = createRequest({ method: 'POST', body: { email: 'test@company.com', password: 'wrong' } })
        const res = await POST(req)
        const { status, body } = await parseResponse(res)

        expect(status).toBe(401)
        expect(body.message).toBe('Invalid credentials')
    })

    it('returns 403 when company is suspended', async () => {
        const user = makeUser({ company: { ...makeUser().company, status: 'SUSPENDED' } })
        mockPrisma.users.findFirst.mockResolvedValue(user as any)
            ; (mockBcrypt.compare as jest.Mock).mockResolvedValue(true)

        const req = createRequest({ method: 'POST', body: { email: 'test@company.com', password: 'pass' } })
        const res = await POST(req)
        const { status, body } = await parseResponse(res)

        expect(status).toBe(403)
        expect(body.message).toContain('suspended')
    })

    it('returns 403 when company is soft-deleted', async () => {
        const user = makeUser({ company: { ...makeUser().company, deleted_at: new Date() } })
        mockPrisma.users.findFirst.mockResolvedValue(user as any)
            ; (mockBcrypt.compare as jest.Mock).mockResolvedValue(true)

        const req = createRequest({ method: 'POST', body: { email: 'test@company.com', password: 'pass' } })
        const res = await POST(req)
        const { status } = await parseResponse(res)

        expect(status).toBe(403)
    })

    it('allows SUPER_ADMIN login even without active company', async () => {
        const superAdmin = makeUser({ role: 'SUPER_ADMIN', company_id: null, company: null })
        mockPrisma.users.findFirst.mockResolvedValue(superAdmin as any)
            ; (mockBcrypt.compare as jest.Mock).mockResolvedValue(true)
            ; (mockJwt.sign as jest.Mock).mockReturnValue('mock-token')

        const req = createRequest({ method: 'POST', body: { email: 'admin@sys.com', password: 'pass' } })
        const res = await POST(req)
        const { status, body } = await parseResponse(res)

        expect(status).toBe(200)
        expect(body.token).toBe('mock-token')
        expect(body.user.role).toBe('SUPER_ADMIN')
    })

    it('returns token and user data on successful login', async () => {
        mockPrisma.users.findFirst.mockResolvedValue(makeUser() as any)
            ; (mockBcrypt.compare as jest.Mock).mockResolvedValue(true)
            ; (mockJwt.sign as jest.Mock).mockReturnValue('valid-token')

        const req = createRequest({ method: 'POST', body: { email: 'test@company.com', password: 'correct' } })
        const res = await POST(req)
        const { status, body } = await parseResponse(res)

        expect(status).toBe(200)
        expect(body.token).toBe('valid-token')
        expect(body.user).toMatchObject({
            id: 10,
            name: 'Test User',
            email: 'test@company.com',
            role: 'COMPANY_ADMIN',
            company_id: 1,
        })
    })

    it('includes company_id in JWT payload', async () => {
        mockPrisma.users.findFirst.mockResolvedValue(makeUser() as any)
            ; (mockBcrypt.compare as jest.Mock).mockResolvedValue(true)
            ; (mockJwt.sign as jest.Mock).mockReturnValue('token')

        const req = createRequest({ method: 'POST', body: { email: 'test@company.com', password: 'pass' } })
        await POST(req)

        expect(mockJwt.sign).toHaveBeenCalledWith(
            expect.objectContaining({ id: 10, role: 'COMPANY_ADMIN', company_id: 1 }),
            expect.any(String),
            expect.any(Object)
        )
    })
})
