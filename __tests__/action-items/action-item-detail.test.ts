/**
 * Action Items [id] Tests
 * Covers: PUT/DELETE /api/action-items/[id]
 * - Field-level updates (isCompleted, assignedTo, description, dueDate)
 * - Delete by ID
 * - Error handling
 */

import { PUT, DELETE } from '@/app/api/action-items/[id]/route'
import prisma from '@/lib/prisma'
import {
    createAuthRequest,
    COMPANY_ADMIN_PAYLOAD,
    makeActionItem,
    parseResponse,
} from '../helpers'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

function makeContext(id: string) {
    return { params: Promise.resolve({ id }) }
}

describe('Action Items [id] API', () => {
    beforeEach(() => jest.clearAllMocks())

    // ─── PUT ──────────────────────────────────────────
    describe('PUT /api/action-items/:id', () => {
        it('updates isCompleted field', async () => {
            mockPrisma.actionItem.update.mockResolvedValue(
                makeActionItem({ is_completed: true }) as any
            )

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { isCompleted: true },
            })
            const res = await PUT(req, makeContext('1'))
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.message).toContain('Updated')
            expect(mockPrisma.actionItem.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { action_item_id: 1 },
                    data: expect.objectContaining({ is_completed: true }),
                })
            )
        })

        it('updates assignedTo field (null clears assignment)', async () => {
            mockPrisma.actionItem.update.mockResolvedValue(makeActionItem() as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { assignedTo: null },
            })
            await PUT(req, makeContext('1'))

            expect(mockPrisma.actionItem.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ assigned_to: null }),
                })
            )
        })

        it('updates description and dueDate together', async () => {
            mockPrisma.actionItem.update.mockResolvedValue(makeActionItem() as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { description: 'New desc', dueDate: '2025-12-31' },
            })
            await PUT(req, makeContext('5'))

            expect(mockPrisma.actionItem.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { action_item_id: 5 },
                    data: expect.objectContaining({
                        description: 'New desc',
                        due_date: expect.any(Date),
                    }),
                })
            )
        })

        it('always includes updated_at in data', async () => {
            mockPrisma.actionItem.update.mockResolvedValue(makeActionItem() as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { isCompleted: false },
            })
            await PUT(req, makeContext('1'))

            expect(mockPrisma.actionItem.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ updated_at: expect.any(Date) }),
                })
            )
        })

        it('includes assignee in response', async () => {
            mockPrisma.actionItem.update.mockResolvedValue(makeActionItem() as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { isCompleted: true },
            })
            await PUT(req, makeContext('1'))

            expect(mockPrisma.actionItem.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: { assignee: true },
                })
            )
        })

        it('returns 500 on database error', async () => {
            jest.spyOn(console, 'error').mockImplementation()
            mockPrisma.actionItem.update.mockRejectedValue(new Error('DB error'))

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { isCompleted: true },
            })
            const res = await PUT(req, makeContext('1'))
            const { status } = await parseResponse(res)

            expect(status).toBe(500)
        })
    })

    // ─── DELETE ───────────────────────────────────────
    describe('DELETE /api/action-items/:id', () => {
        it('deletes action item by ID', async () => {
            mockPrisma.actionItem.delete.mockResolvedValue(makeActionItem() as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, { method: 'DELETE' })
            const res = await DELETE(req, makeContext('1'))
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.message).toContain('Deleted')
            expect(mockPrisma.actionItem.delete).toHaveBeenCalledWith({
                where: { action_item_id: 1 },
            })
        })

        it('returns 500 when item does not exist', async () => {
            jest.spyOn(console, 'error').mockImplementation()
            mockPrisma.actionItem.delete.mockRejectedValue(new Error('Record not found'))

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, { method: 'DELETE' })
            const res = await DELETE(req, makeContext('999'))
            const { status } = await parseResponse(res)

            expect(status).toBe(500)
        })
    })
})
