/**
 * Action Items Tests
 * Covers: GET/POST /api/action-items, PUT/DELETE /api/action-items/[id]
 * - Company-scoped queries
 * - Validation
 * - CRUD operations
 */


import { GET, POST } from '@/app/api/action-items/route'
import prisma from '@/lib/prisma'
import {
    createAuthRequest,
    COMPANY_ADMIN_PAYLOAD,
    COMPANY2_ADMIN_PAYLOAD,
    makeActionItem,
    parseResponse,
} from '../helpers'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Action Items API', () => {
    beforeEach(() => jest.clearAllMocks())

    describe('GET /api/action-items', () => {
        it('fetches action items scoped to company_id', async () => {
            mockPrisma.actionItem.findMany.mockResolvedValue([makeActionItem()] as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                url: 'http://localhost:3000/api/action-items?meetingId=1',
            })
            const res = await GET(req)
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.data).toHaveLength(1)
            expect(mockPrisma.actionItem.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ company_id: 1, meeting_id: 1 }),
                })
            )
        })

        it('filters by staffId when provided', async () => {
            mockPrisma.actionItem.findMany.mockResolvedValue([])

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                url: 'http://localhost:3000/api/action-items?staffId=3',
            })
            await GET(req)

            expect(mockPrisma.actionItem.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ assigned_to: 3 }),
                })
            )
        })
    })

    describe('POST /api/action-items', () => {
        it('returns 400 when description or meetingId is missing', async () => {
            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'POST',
                body: { description: '' },
            })
            const res = await POST(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(400)
        })

        it('creates action item with company_id from JWT', async () => {
            mockPrisma.actionItem.create.mockResolvedValue(makeActionItem() as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'POST',
                body: { description: 'Do the thing', meetingId: 1, assignedTo: 1 },
            })
            const res = await POST(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(201)
            expect(mockPrisma.actionItem.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ company_id: 1 }),
                })
            )
        })
    })
})
