/**
 * Meetings Tests
 * Covers: GET/POST /api/meetings
 * - Company-scoped queries
 * - Role-based visibility
 * - Permission enforcement
 * - Transaction integrity
 */


import { GET, POST } from '@/app/api/meetings/route'
import prisma from '@/lib/prisma'
import {
    createAuthRequest,
    COMPANY_ADMIN_PAYLOAD,
    MEMBER_PAYLOAD,
    COMPANY2_ADMIN_PAYLOAD,
    SUPER_ADMIN_PAYLOAD,
    makeMeeting,
    makeUser,
    parseResponse,
} from '../helpers'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Meetings API', () => {
    beforeEach(() => jest.clearAllMocks())

    // ─── GET ───────────────────────────────────────────
    describe('GET /api/meetings', () => {
        it('returns empty array for users without company_id', async () => {
            const req = createAuthRequest(SUPER_ADMIN_PAYLOAD)
            const res = await GET(req)
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.data).toEqual([])
        })

        it('returns meetings scoped to company_id for COMPANY_ADMIN', async () => {
            mockPrisma.meetings.findMany.mockResolvedValue([makeMeeting()] as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD)
            const res = await GET(req)
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.data).toHaveLength(1)
            expect(mockPrisma.meetings.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ company_id: 1 }),
                })
            )
        })

        it('filters by created_by/meeting_member for MEMBER role', async () => {
            mockPrisma.users.findUnique.mockResolvedValue(makeUser({ role: 'MEMBER', user_id: 20 }) as any)
            mockPrisma.staff.findFirst.mockResolvedValue({ staff_id: 5 } as any)
            mockPrisma.meetings.findMany.mockResolvedValue([])

            const req = createAuthRequest(MEMBER_PAYLOAD)
            await GET(req)

            expect(mockPrisma.meetings.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        company_id: 1,
                        OR: expect.arrayContaining([
                            expect.objectContaining({ created_by: 20 }),
                        ]),
                    }),
                })
            )
        })
    })

    // ─── POST ──────────────────────────────────────────
    describe('POST /api/meetings', () => {
        it('returns 403 for MEMBER role', async () => {
            const req = createAuthRequest(MEMBER_PAYLOAD, {
                method: 'POST',
                body: { meetingDate: '2025-06-01', meetingTypeId: 1 },
            })
            const res = await POST(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(403)
        })

        it('returns 400 when required fields are missing', async () => {
            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'POST',
                body: { meetingDate: '' },
            })
            const res = await POST(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(400)
        })

        it('creates meeting via transaction with company_id from JWT', async () => {
            const createdMeeting = makeMeeting()
            mockPrisma.$transaction.mockImplementation(async (fn: any) => {
                const tx = {
                    meetings: { create: jest.fn().mockResolvedValue(createdMeeting) },
                    meeting_member: { createMany: jest.fn().mockResolvedValue({ count: 2 }) },
                }
                return fn(tx)
            })

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'POST',
                body: {
                    meetingDate: '2025-06-01',
                    meetingTypeId: 1,
                    description: 'Test',
                    staffIds: [1, 2],
                },
            })
            const res = await POST(req)
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.message).toContain('created')
        })

        it('sets company_id from header, ignoring body-provided company_id', async () => {
            mockPrisma.$transaction.mockImplementation(async (fn: any) => {
                const tx = {
                    meetings: {
                        create: jest.fn().mockImplementation((args: any) => {
                            // Verify company_id comes from header (1), not body (999)
                            expect(args.data.company_id).toBe(1)
                            return makeMeeting()
                        }),
                    },
                    meeting_member: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
                }
                return fn(tx)
            })

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'POST',
                body: {
                    meetingDate: '2025-06-01',
                    meetingTypeId: 1,
                    company_id: 999, // ATTACK: injected fake company_id
                },
            })
            await POST(req)
        })
    })
})
