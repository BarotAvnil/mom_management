/**
 * Multi-Tenant Isolation Security Tests
 * 
 * CRITICAL: These tests validate zero cross-tenant data leakage.
 * Simulates:
 * - Cross-tenant access attempts (Company 2 accessing Company 1 data)
 * - Manipulated request body with fake company_id
 * - Direct Object ID attacks (IDOR)
 * - Horizontal privilege escalation
 * - company_id derivation exclusively from JWT (middleware headers)
 */

jest.mock('bcryptjs')

import { GET as getStaff, POST as postStaff } from '@/app/api/staff/route'
import { GET as getMeetings, POST as postMeetings } from '@/app/api/meetings/route'
import { GET as getMeetingTypes, POST as postMeetingType } from '@/app/api/meeting-type/route'
import { GET as getActionItems, POST as postActionItem } from '@/app/api/action-items/route'
import { GET as getDashboard } from '@/app/api/dashboard/stats/route'
import prisma from '@/lib/prisma'
import {
    createAuthRequest,
    COMPANY_ADMIN_PAYLOAD,
    COMPANY2_ADMIN_PAYLOAD,
    MEMBER_PAYLOAD,
    COMPANY2_MEMBER_PAYLOAD,
    makeStaff,
    makeMeeting,
    makeMeetingType,
    makeActionItem,
    parseResponse,
} from '../helpers'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Multi-Tenant Isolation Security', () => {
    beforeEach(() => jest.clearAllMocks())

    // ─── Cross-Tenant Query Isolation ─────────────────
    describe('All GET routes use company_id from JWT header, NOT request', () => {
        it('Staff: Company 2 admin query uses company_id=2, not 1', async () => {
            mockPrisma.staff.findMany.mockResolvedValue([])

            const req = createAuthRequest(COMPANY2_ADMIN_PAYLOAD)
            await getStaff(req)

            expect(mockPrisma.staff.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { company_id: 2 } })
            )
        })

        it('Meetings: Company 2 cannot see Company 1 meetings', async () => {
            mockPrisma.meetings.findMany.mockResolvedValue([])

            const req = createAuthRequest(COMPANY2_ADMIN_PAYLOAD)
            await getMeetings(req)

            expect(mockPrisma.meetings.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ company_id: 2 }),
                })
            )
        })

        it('Meeting Types: Company 2 only sees its own types', async () => {
            mockPrisma.meeting_type.findMany.mockResolvedValue([])

            const req = createAuthRequest(COMPANY2_ADMIN_PAYLOAD)
            await getMeetingTypes(req)

            expect(mockPrisma.meeting_type.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { company_id: 2 } })
            )
        })

        it('Action Items: Company 2 only sees its own items', async () => {
            mockPrisma.actionItem.findMany.mockResolvedValue([])

            const req = createAuthRequest(COMPANY2_ADMIN_PAYLOAD, {
                url: 'http://localhost:3000/api/action-items',
            })
            await getActionItems(req)

            expect(mockPrisma.actionItem.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ company_id: 2 }),
                })
            )
        })

        it('Dashboard: Company 2 stats scoped correctly', async () => {
            mockPrisma.meetings.count.mockResolvedValue(0)
            mockPrisma.meetings.findMany.mockResolvedValue([])

            const req = createAuthRequest(COMPANY2_ADMIN_PAYLOAD)
            await getDashboard(req)

            expect(mockPrisma.meetings.count).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ company_id: 2 }),
                })
            )
        })
    })

    // ─── Request Body company_id Injection Attacks ────
    describe('Backend ignores request-body injected company_id', () => {
        it('POST Staff: injected company_id in body is ignored', async () => {
            mockPrisma.staff.create.mockResolvedValue(makeStaff({ company_id: 1 }) as any)

            // Company 1 admin sends body with company_id: 2 (ATTACK)
            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'POST',
                body: { name: 'Hacker Staff', company_id: 2 },
            })
            await postStaff(req)

            // Prisma should receive company_id=1 (from header), NOT 2 (from body)
            expect(mockPrisma.staff.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ company_id: 1 }),
                })
            )
        })

        it('POST Meeting Type: injected company_id in body is ignored', async () => {
            mockPrisma.meeting_type.create.mockResolvedValue(makeMeetingType({ company_id: 1 }) as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'POST',
                body: { meetingTypeName: 'Hack', company_id: 999 },
            })
            await postMeetingType(req)

            expect(mockPrisma.meeting_type.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ company_id: 1 }),
                })
            )
        })

        it('POST Action Item: injected company_id in body is ignored', async () => {
            mockPrisma.actionItem.create.mockResolvedValue(makeActionItem() as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'POST',
                body: { description: 'test', meetingId: 1, company_id: 999 },
            })
            await postActionItem(req)

            expect(mockPrisma.actionItem.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ company_id: 1 }),
                })
            )
        })

        it('POST Meeting: injected company_id in body is ignored (transaction)', async () => {
            mockPrisma.$transaction.mockImplementation(async (fn: any) => {
                const tx = {
                    meetings: {
                        create: jest.fn().mockImplementation((args: any) => {
                            // CRITICAL: company_id must come from header (1), not body (999)
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
                body: { meetingDate: '2025-06-01', meetingTypeId: 1, company_id: 999 },
            })
            await postMeetings(req)
        })
    })

    // ─── IDOR — Direct Object ID Attacks ──────────────
    describe('IDOR Protection via company-scoped queries', () => {
        it('Querying action items with foreign meetingId still scoped by company_id', async () => {
            mockPrisma.actionItem.findMany.mockResolvedValue([])

            // Company 2 user tries to access Company 1 meeting's action items by ID
            const req = createAuthRequest(COMPANY2_ADMIN_PAYLOAD, {
                url: 'http://localhost:3000/api/action-items?meetingId=1',
            })
            await getActionItems(req)

            // Even with meetingId=1 (Company 1), query includes company_id=2
            expect(mockPrisma.actionItem.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        meeting_id: 1,
                        company_id: 2, // Scoped — prevents IDOR
                    }),
                })
            )
        })
    })

    // ─── Horizontal Privilege Escalation ──────────────
    describe('Horizontal privilege escalation prevention', () => {
        it('MEMBER from Company 2 cannot query Company 1 staff', async () => {
            mockPrisma.staff.findMany.mockResolvedValue([])

            const req = createAuthRequest(COMPANY2_MEMBER_PAYLOAD)
            await getStaff(req)

            expect(mockPrisma.staff.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { company_id: 2 } })
            )
        })

        it('MEMBER from Company 1 data is isolated from Company 2 dashboard', async () => {
            mockPrisma.users.findUnique.mockResolvedValue({ user_id: 40, email: 'c2@corp.com' } as any)
            mockPrisma.staff.findFirst.mockResolvedValue(null)
            mockPrisma.meetings.count.mockResolvedValue(0)
            mockPrisma.meetings.findMany.mockResolvedValue([])

            const req = createAuthRequest(COMPANY2_MEMBER_PAYLOAD)
            await getDashboard(req)

            // All queries use company_id=2
            const allCalls = mockPrisma.meetings.count.mock.calls
            allCalls.forEach((call: any[]) => {
                expect(call[0].where).toHaveProperty('company_id', 2)
            })
        })
    })
})
