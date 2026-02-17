/**
 * Meetings [meetingId] Tests
 * Covers: GET/PUT/DELETE /api/meetings/[meetingId]
 * - Visibility checks (creator, meeting admin, invited member)
 * - Permission enforcement for updates
 * - Transaction for participant management
 * - Cancellation logic
 * - Hard delete
 */

import { GET, PUT, DELETE } from '@/app/api/meetings/[meetingId]/route'
import prisma from '@/lib/prisma'
import {
    createAuthRequest,
    COMPANY_ADMIN_PAYLOAD,
    MEMBER_PAYLOAD,
    makeMeeting,
    makeUser,
    parseResponse,
} from '../helpers'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

function makeContext(meetingId: string) {
    return { params: Promise.resolve({ meetingId }) }
}

describe('Meetings [meetingId] API', () => {
    beforeEach(() => jest.clearAllMocks())

    // ─── GET ──────────────────────────────────────────
    describe('GET /api/meetings/:meetingId', () => {
        it('returns 400 for non-numeric ID', async () => {
            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD)
            const res = await GET(req, makeContext('abc'))
            const { status } = await parseResponse(res)

            expect(status).toBe(400)
        })

        it('returns 404 when meeting not found', async () => {
            mockPrisma.meetings.findUnique.mockResolvedValue(null)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD)
            const res = await GET(req, makeContext('999'))
            const { status } = await parseResponse(res)

            expect(status).toBe(404)
        })

        it('allows COMPANY_ADMIN to view any meeting', async () => {
            mockPrisma.meetings.findUnique.mockResolvedValue(makeMeeting() as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD)
            const res = await GET(req, makeContext('1'))
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.data.meeting_id).toBe(1)
        })

        it('allows creator to view their meeting', async () => {
            mockPrisma.meetings.findUnique.mockResolvedValue(
                makeMeeting({ created_by: 20 }) as any
            )

            const req = createAuthRequest(MEMBER_PAYLOAD)
            const res = await GET(req, makeContext('1'))
            const { status } = await parseResponse(res)

            expect(status).toBe(200)
        })

        it('allows meeting admin to view the meeting', async () => {
            mockPrisma.meetings.findUnique.mockResolvedValue(
                makeMeeting({ created_by: 99, meeting_admin_id: 20 }) as any
            )

            const req = createAuthRequest(MEMBER_PAYLOAD)
            const res = await GET(req, makeContext('1'))
            const { status } = await parseResponse(res)

            expect(status).toBe(200)
        })

        it('allows invited member to view the meeting', async () => {
            mockPrisma.meetings.findUnique.mockResolvedValue(
                makeMeeting({
                    created_by: 99,
                    meeting_admin_id: 99,
                    meeting_member: [{ staff_id: 5 }],
                }) as any
            )
            mockPrisma.users.findUnique.mockResolvedValue(
                makeUser({ user_id: 20, email: 'member@corp.com' }) as any
            )
            mockPrisma.staff.findFirst.mockResolvedValue({ staff_id: 5, email: 'member@corp.com' } as any)

            const req = createAuthRequest(MEMBER_PAYLOAD)
            const res = await GET(req, makeContext('1'))
            const { status } = await parseResponse(res)

            expect(status).toBe(200)
        })

        it('returns 403 when MEMBER is not creator, admin, or invited', async () => {
            mockPrisma.meetings.findUnique.mockResolvedValue(
                makeMeeting({ created_by: 99, meeting_admin_id: 99 }) as any
            )
            mockPrisma.users.findUnique.mockResolvedValue(
                makeUser({ user_id: 20, email: 'outsider@corp.com' }) as any
            )
            mockPrisma.staff.findFirst.mockResolvedValue({ staff_id: 50 } as any)

            const req = createAuthRequest(MEMBER_PAYLOAD)
            const res = await GET(req, makeContext('1'))
            const { status } = await parseResponse(res)

            expect(status).toBe(403)
        })
    })

    // ─── PUT ──────────────────────────────────────────
    describe('PUT /api/meetings/:meetingId', () => {
        it('returns 404 when meeting not found', async () => {
            mockPrisma.meetings.findUnique.mockResolvedValue(null)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { description: 'Updated' },
            })
            const res = await PUT(req, makeContext('999'))
            const { status } = await parseResponse(res)

            expect(status).toBe(404)
        })

        it('returns 403 when MEMBER is not creator or admin', async () => {
            mockPrisma.meetings.findUnique.mockResolvedValue(
                makeMeeting({ created_by: 99, meeting_admin_id: 99 }) as any
            )

            const req = createAuthRequest(MEMBER_PAYLOAD, {
                method: 'PUT',
                body: { description: 'Hacked' },
            })
            const res = await PUT(req, makeContext('1'))
            const { status } = await parseResponse(res)

            expect(status).toBe(403)
        })

        it('allows creator to update meeting via transaction', async () => {
            mockPrisma.meetings.findUnique.mockResolvedValue(
                makeMeeting({ created_by: 10 }) as any
            )
            mockPrisma.$transaction.mockImplementation(async (fn: any) => {
                const tx = {
                    meetings: {
                        update: jest.fn().mockResolvedValue(makeMeeting({ meeting_description: 'Updated' })),
                    },
                    meeting_member: {
                        deleteMany: jest.fn(),
                        findMany: jest.fn().mockResolvedValue([]),
                        createMany: jest.fn().mockResolvedValue({ count: 2 }),
                    },
                }
                return fn(tx)
            })

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { description: 'Updated', staffIds: [1, 2] },
            })
            const res = await PUT(req, makeContext('1'))
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.message).toContain('Updated')
        })

        it('handles cancellation data correctly', async () => {
            mockPrisma.meetings.findUnique.mockResolvedValue(
                makeMeeting({ created_by: 10 }) as any
            )
            mockPrisma.$transaction.mockImplementation(async (fn: any) => {
                const tx = {
                    meetings: {
                        update: jest.fn().mockImplementation((args: any) => {
                            expect(args.data.is_cancelled).toBe(true)
                            expect(args.data.cancellation_reason).toBe('Weather')
                            return makeMeeting({ is_cancelled: true })
                        }),
                    },
                }
                return fn(tx)
            })

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { isCancelled: true, cancellationReason: 'Weather' },
            })
            await PUT(req, makeContext('1'))
        })

        it('COMPANY_ADMIN can update any meeting (sys admin bypass)', async () => {
            mockPrisma.meetings.findUnique.mockResolvedValue(
                makeMeeting({ created_by: 99, meeting_admin_id: 99 }) as any
            )
            mockPrisma.$transaction.mockImplementation(async (fn: any) => {
                const tx = {
                    meetings: { update: jest.fn().mockResolvedValue(makeMeeting()) },
                }
                return fn(tx)
            })

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { description: 'Admin override' },
            })
            const res = await PUT(req, makeContext('1'))
            const { status } = await parseResponse(res)

            expect(status).toBe(200)
        })
    })

    // ─── DELETE ───────────────────────────────────────
    describe('DELETE /api/meetings/:meetingId', () => {
        it('deletes meeting by ID', async () => {
            mockPrisma.meetings.delete.mockResolvedValue(makeMeeting() as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, { method: 'DELETE' })
            const res = await DELETE(req, makeContext('1'))
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.message).toContain('Deleted')
            expect(mockPrisma.meetings.delete).toHaveBeenCalledWith({
                where: { meeting_id: 1 },
            })
        })

        it('returns 500 when delete fails', async () => {
            mockPrisma.meetings.delete.mockRejectedValue(new Error('FK constraint'))

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, { method: 'DELETE' })
            const res = await DELETE(req, makeContext('999'))
            const { status } = await parseResponse(res)

            expect(status).toBe(500)
        })
    })
})
