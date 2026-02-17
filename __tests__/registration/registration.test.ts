/**
 * Registration Tests
 * Covers: POST /api/registration
 */

jest.mock('bcryptjs')

import { POST } from '@/app/api/registration/route'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createRequest, makeRegistrationRequest, parseResponse } from '../helpers'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('POST /api/registration', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns 400 when required fields are missing', async () => {
        const req = createRequest({
            method: 'POST',
            body: { companyName: 'C', assistantName: '' },
        })
        const res = await POST(req)
        const { status } = await parseResponse(res)

        expect(status).toBe(400)
    })

    it('returns 409 when registration email already exists', async () => {
        mockPrisma.registration_requests.findUnique.mockResolvedValue(makeRegistrationRequest() as any)

        const req = createRequest({
            method: 'POST',
            body: { companyName: 'C', assistantName: 'A', email: 'jane@newcorp.com', password: 'pw' },
        })
        const res = await POST(req)
        const { status } = await parseResponse(res)

        expect(status).toBe(409)
    })

    it('returns 409 when email is already a user', async () => {
        mockPrisma.registration_requests.findUnique.mockResolvedValue(null)
        mockPrisma.users.findFirst.mockResolvedValue({ user_id: 1 } as any)

        const req = createRequest({
            method: 'POST',
            body: { companyName: 'C', assistantName: 'A', email: 'existing@corp.com', password: 'pw' },
        })
        const res = await POST(req)
        const { status } = await parseResponse(res)

        expect(status).toBe(409)
    })

    it('hashes password and creates request on success', async () => {
        mockPrisma.registration_requests.findUnique.mockResolvedValue(null)
        mockPrisma.users.findFirst.mockResolvedValue(null)
            ; (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-12')
        mockPrisma.registration_requests.create.mockResolvedValue(makeRegistrationRequest() as any)

        const req = createRequest({
            method: 'POST',
            body: { companyName: 'NewCorp', assistantName: 'Jane', email: 'jane@new.com', password: 'mypass' },
        })
        const res = await POST(req)
        const { status, body } = await parseResponse(res)

        expect(status).toBe(201)
        expect(bcrypt.hash).toHaveBeenCalledWith('mypass', 12)
        expect(mockPrisma.registration_requests.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    assistant_password: 'hashed-12',
                    status: 'PENDING',
                }),
            })
        )
    })
})
