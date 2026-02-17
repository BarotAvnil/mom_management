/**
 * Dashboard Stats Tests
 * Covers: GET /api/dashboard/stats
 */


import { GET } from '@/app/api/dashboard/stats/route'
import prisma from '@/lib/prisma'
import {
    createAuthRequest,
    SUPER_ADMIN_PAYLOAD,
    COMPANY_ADMIN_PAYLOAD,
    MEMBER_PAYLOAD,
    makeUser,
    parseResponse,
} from '../helpers'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('GET /api/dashboard/stats', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns empty stats when no company_id (SUPER_ADMIN)', async () => {
        const req = createAuthRequest(SUPER_ADMIN_PAYLOAD)
        const res = await GET(req)
        const { status, body } = await parseResponse(res)

        expect(status).toBe(200)
        expect(body.data.stats.total).toBe(0)
    })

    it('returns stats scoped to company_id for COMPANY_ADMIN', async () => {
        mockPrisma.meetings.count.mockResolvedValue(10)
        mockPrisma.meetings.findMany.mockResolvedValue([])

        const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD)
        const res = await GET(req)
        const { status, body } = await parseResponse(res)

        expect(status).toBe(200)
        expect(body.success).toBe(true)
        // Verify company_id filter was applied
        expect(mockPrisma.meetings.count).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ company_id: 1 }),
            })
        )
    })

    it('applies role-based filtering for MEMBER', async () => {
        mockPrisma.users.findUnique.mockResolvedValue(makeUser({ role: 'MEMBER', user_id: 20 }) as any)
        mockPrisma.staff.findFirst.mockResolvedValue({ staff_id: 5 } as any)
        mockPrisma.meetings.count.mockResolvedValue(3)
        mockPrisma.meetings.findMany.mockResolvedValue([])

        const req = createAuthRequest(MEMBER_PAYLOAD)
        const res = await GET(req)
        const { status } = await parseResponse(res)

        expect(status).toBe(200)
        expect(mockPrisma.meetings.count).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    company_id: 1,
                    OR: expect.any(Array),
                }),
            })
        )
    })
})
