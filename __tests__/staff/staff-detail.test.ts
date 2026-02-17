/**
 * Staff [id] Tests
 * Covers: PUT/DELETE /api/staff/[id]
 * - Validation (NaN ID)
 * - Field-level updates
 * - Cascade delete
 * - Error handling
 */

import { PUT, DELETE } from '@/app/api/staff/[id]/route'
import prisma from '@/lib/prisma'
import {
    createAuthRequest,
    COMPANY_ADMIN_PAYLOAD,
    makeStaff,
    parseResponse,
} from '../helpers'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

function makeContext(id: string) {
    return { params: Promise.resolve({ id }) }
}

describe('Staff [id] API', () => {
    beforeEach(() => jest.clearAllMocks())

    // ─── PUT ──────────────────────────────────────────
    describe('PUT /api/staff/:id', () => {
        it('returns 400 for non-numeric ID', async () => {
            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { name: 'Test' },
            })
            const res = await PUT(req, makeContext('abc'))
            const { status } = await parseResponse(res)

            expect(status).toBe(400)
        })

        it('updates staff name', async () => {
            mockPrisma.staff.update.mockResolvedValue(
                makeStaff({ staff_name: 'Updated Name' }) as any
            )

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { name: 'Updated Name' },
            })
            const res = await PUT(req, makeContext('1'))
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.message).toContain('updated')
            expect(mockPrisma.staff.update).toHaveBeenCalledWith({
                where: { staff_id: 1 },
                data: expect.objectContaining({ staff_name: 'Updated Name' }),
            })
        })

        it('updates email, mobile, and remarks together', async () => {
            mockPrisma.staff.update.mockResolvedValue(makeStaff() as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { email: 'new@corp.com', mobileNo: '1111111111', remarks: 'Updated' },
            })
            await PUT(req, makeContext('5'))

            expect(mockPrisma.staff.update).toHaveBeenCalledWith({
                where: { staff_id: 5 },
                data: expect.objectContaining({
                    email: 'new@corp.com',
                    mobile_no: '1111111111',
                    remarks: 'Updated',
                }),
            })
        })

        it('only includes defined fields in update', async () => {
            mockPrisma.staff.update.mockResolvedValue(makeStaff() as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { name: 'Only Name' },
            })
            await PUT(req, makeContext('1'))

            const callData = mockPrisma.staff.update.mock.calls[0][0].data
            expect(callData).toHaveProperty('staff_name', 'Only Name')
            expect(callData).not.toHaveProperty('email')
            expect(callData).not.toHaveProperty('mobile_no')
        })

        it('returns 500 on database error', async () => {
            jest.spyOn(console, 'error').mockImplementation()
            mockPrisma.staff.update.mockRejectedValue(new Error('Not found'))

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { name: 'Test' },
            })
            const res = await PUT(req, makeContext('999'))
            const { status } = await parseResponse(res)

            expect(status).toBe(500)
        })
    })

    // ─── DELETE ───────────────────────────────────────
    describe('DELETE /api/staff/:id', () => {
        it('returns 400 for non-numeric ID', async () => {
            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, { method: 'DELETE' })
            const res = await DELETE(req, makeContext('nope'))
            const { status } = await parseResponse(res)

            expect(status).toBe(400)
        })

        it('deletes staff by ID (cascade)', async () => {
            mockPrisma.staff.delete.mockResolvedValue(makeStaff() as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, { method: 'DELETE' })
            const res = await DELETE(req, makeContext('1'))
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.message).toContain('deleted')
            expect(mockPrisma.staff.delete).toHaveBeenCalledWith({
                where: { staff_id: 1 },
            })
        })

        it('returns 500 when staff not found', async () => {
            jest.spyOn(console, 'error').mockImplementation()
            mockPrisma.staff.delete.mockRejectedValue(new Error('Record not found'))

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, { method: 'DELETE' })
            const res = await DELETE(req, makeContext('999'))
            const { status } = await parseResponse(res)

            expect(status).toBe(500)
        })
    })
})
