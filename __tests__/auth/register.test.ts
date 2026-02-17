/**
 * Auth Register Tests
 * Covers: POST /api/auth/register
 */

jest.mock('bcryptjs')
jest.mock('jsonwebtoken')

import { POST } from '@/app/api/auth/register/route'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createRequest, parseResponse } from '../helpers'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('POST /api/auth/register', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns 400 when required fields are missing', async () => {
        const req = createRequest({ method: 'POST', body: { name: 'A', email: '' } })
        const res = await POST(req)
        const { status, body } = await parseResponse(res)

        expect(status).toBe(400)
        expect(body.message).toBe('All fields are required')
    })

    it('returns 409 when email already exists', async () => {
        mockPrisma.users.findUnique.mockResolvedValue({ user_id: 1 } as any)

        const req = createRequest({
            method: 'POST',
            body: { name: 'Test', email: 'dup@corp.com', password: 'pass', role: 'MEMBER' },
        })
        const res = await POST(req)
        const { status, body } = await parseResponse(res)

        expect(status).toBe(409)
        expect(body.message).toBe('User already exists')
    })

    it('hashes password before storing', async () => {
        mockPrisma.users.findUnique.mockResolvedValue(null)
            ; (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw')
        mockPrisma.users.create.mockResolvedValue({ user_id: 5, name: 'N', email: 'n@c.com', role: 'MEMBER' } as any)
            ; (jwt.sign as jest.Mock).mockReturnValue('tok')

        const req = createRequest({
            method: 'POST',
            body: { name: 'New', email: 'new@corp.com', password: 'plaintext', role: 'MEMBER' },
        })
        await POST(req)

        expect(bcrypt.hash).toHaveBeenCalledWith('plaintext', 10)
        expect(mockPrisma.users.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ password: 'hashed-pw' }),
            })
        )
    })

    it('returns user data and token on success', async () => {
        mockPrisma.users.findUnique.mockResolvedValue(null)
            ; (bcrypt.hash as jest.Mock).mockResolvedValue('h')
        mockPrisma.users.create.mockResolvedValue({ user_id: 5, name: 'N', email: 'n@c.com', role: 'MEMBER' } as any)
            ; (jwt.sign as jest.Mock).mockReturnValue('new-token')

        const req = createRequest({
            method: 'POST',
            body: { name: 'New', email: 'n@c.com', password: 'pw', role: 'MEMBER' },
        })
        const res = await POST(req)
        const { status, body } = await parseResponse(res)

        expect(status).toBe(200)
        expect(body.token).toBe('new-token')
        expect(body.user.id).toBe(5)
    })
})
