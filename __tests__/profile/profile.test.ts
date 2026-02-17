/**
 * Profile Tests
 * Covers: GET/PUT /api/profile
 */

jest.mock('bcryptjs')

import { GET, PUT } from '@/app/api/profile/route'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import {
    createAuthRequest,
    createRequest,
    COMPANY_ADMIN_PAYLOAD,
    makeUser,
    parseResponse,
} from '../helpers'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Profile API', () => {
    beforeEach(() => jest.clearAllMocks())

    describe('GET /api/profile', () => {
        it('returns 401 when x-user-id is missing', async () => {
            const req = createRequest({ url: 'http://localhost:3000/api/profile' })
            const res = await GET(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(401)
        })

        it('returns 404 when user not found', async () => {
            mockPrisma.users.findUnique.mockResolvedValue(null)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                url: 'http://localhost:3000/api/profile',
            })
            const res = await GET(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(404)
        })

        it('returns user profile with stats for tenant users', async () => {
            mockPrisma.users.findUnique.mockResolvedValue(makeUser() as any)
            mockPrisma.staff.findFirst.mockResolvedValue({ staff_id: 1 } as any)
            mockPrisma.meetings.count.mockResolvedValue(5)
            mockPrisma.meeting_member.count.mockResolvedValue(3)
            mockPrisma.actionItem.count.mockResolvedValue(2)
            mockPrisma.meetings.findMany.mockResolvedValue([])
            mockPrisma.actionItem.findMany.mockResolvedValue([])

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                url: 'http://localhost:3000/api/profile',
            })
            const res = await GET(req)
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.data.email).toBe('test@company.com')
            expect(body.stats).toBeDefined()
        })
    })

    describe('PUT /api/profile', () => {
        it('returns 401 when x-user-id is missing', async () => {
            const req = createRequest({
                method: 'PUT',
                body: { name: 'New' },
                url: 'http://localhost:3000/api/profile',
            })
            const res = await PUT(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(401)
        })

        it('hashes password when updating', async () => {
            ; (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash')
            mockPrisma.users.update.mockResolvedValue(makeUser() as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { name: 'Updated', password: 'newpass' },
                url: 'http://localhost:3000/api/profile',
            })
            const res = await PUT(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(200)
            expect(bcrypt.hash).toHaveBeenCalledWith('newpass', 10)
            expect(mockPrisma.users.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ password: 'new-hash', name: 'Updated' }),
                })
            )
        })
    })
})
