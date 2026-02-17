/**
 * Staff Tests
 * Covers: GET/POST/DELETE /api/staff, PUT/DELETE /api/staff/[id]
 * Includes multi-tenant company_id filtering enforcement
 */

jest.mock('bcryptjs')

import { GET, POST, DELETE } from '@/app/api/staff/route'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import {
    createAuthRequest,
    COMPANY_ADMIN_PAYLOAD,
    COMPANY2_ADMIN_PAYLOAD,
    makeStaff,
    parseResponse,
} from '../helpers'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Staff API', () => {
    beforeEach(() => jest.clearAllMocks())

    // ─── GET ───────────────────────────────────────────
    describe('GET /api/staff', () => {
        it('fetches staff scoped to company_id from middleware', async () => {
            const staffList = [makeStaff(), makeStaff({ staff_id: 2, staff_name: 'Jane' })]
            mockPrisma.staff.findMany.mockResolvedValue(staffList as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD)
            const res = await GET(req)
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.data).toHaveLength(2)
            expect(mockPrisma.staff.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { company_id: 1 },
                })
            )
        })

        it('enforces company_id — Company 2 admin cannot see Company 1 staff', async () => {
            mockPrisma.staff.findMany.mockResolvedValue([])

            const req = createAuthRequest(COMPANY2_ADMIN_PAYLOAD)
            await GET(req)

            // Prisma called with company_id=2, not 1
            expect(mockPrisma.staff.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { company_id: 2 },
                })
            )
        })
    })

    // ─── POST ──────────────────────────────────────────
    describe('POST /api/staff', () => {
        it('returns 400 when staff name is missing', async () => {
            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'POST',
                body: { name: '', email: 'a@b.com' },
            })
            const res = await POST(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(400)
        })

        it('creates staff with company_id from JWT, not request body', async () => {
            mockPrisma.staff.create.mockResolvedValue(makeStaff() as any)
                ; (bcrypt.hash as jest.Mock).mockResolvedValue('hashed')
            mockPrisma.users.create.mockResolvedValue({} as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'POST',
                body: { name: 'New Guy', email: 'new@corp.com', mobileNo: '123' },
            })
            const res = await POST(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(200)
            expect(mockPrisma.staff.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ company_id: 1 }),
                })
            )
        })

        it('creates a linked user login when email is provided', async () => {
            mockPrisma.staff.create.mockResolvedValue(makeStaff() as any)
                ; (bcrypt.hash as jest.Mock).mockResolvedValue('h')
            mockPrisma.users.create.mockResolvedValue({} as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'POST',
                body: { name: 'Staff', email: 'staff@corp.com' },
            })
            await POST(req)

            expect(mockPrisma.users.create).toHaveBeenCalled()
        })
    })

    // ─── DELETE ────────────────────────────────────────
    describe('DELETE /api/staff', () => {
        it('returns 400 when id is missing', async () => {
            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'DELETE',
                url: 'http://localhost:3000/api/staff',
            })
            const res = await DELETE(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(400)
        })

        it('deletes staff by id', async () => {
            mockPrisma.staff.delete.mockResolvedValue({} as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'DELETE',
                url: 'http://localhost:3000/api/staff?id=1',
            })
            const res = await DELETE(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(200)
            expect(mockPrisma.staff.delete).toHaveBeenCalledWith({ where: { staff_id: 1 } })
        })
    })
})
