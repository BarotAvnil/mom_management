/**
 * Meeting Type Tests
 * Covers: GET/POST/PUT/DELETE /api/meeting-type
 */


import { GET, POST, PUT, DELETE } from '@/app/api/meeting-type/route'
import prisma from '@/lib/prisma'
import {
    createAuthRequest,
    COMPANY_ADMIN_PAYLOAD,
    COMPANY2_ADMIN_PAYLOAD,
    makeMeetingType,
    parseResponse,
} from '../helpers'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Meeting Type API', () => {
    beforeEach(() => jest.clearAllMocks())

    describe('GET /api/meeting-type', () => {
        it('returns empty when no company_id', async () => {
            const req = createAuthRequest({ id: 1, role: 'SUPER_ADMIN', company_id: null })
            const res = await GET(req)
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.data).toEqual([])
        })

        it('fetches types scoped to company_id', async () => {
            mockPrisma.meeting_type.findMany.mockResolvedValue([makeMeetingType()] as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD)
            const res = await GET(req)
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.data).toHaveLength(1)
            expect(mockPrisma.meeting_type.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { company_id: 1 },
                })
            )
        })
    })

    describe('POST /api/meeting-type', () => {
        it('returns 400 when name is missing', async () => {
            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'POST',
                body: { meetingTypeName: '' },
            })
            const res = await POST(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(400)
        })

        it('creates meeting type with company_id from JWT', async () => {
            mockPrisma.meeting_type.create.mockResolvedValue(makeMeetingType() as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'POST',
                body: { meetingTypeName: 'Sprint Review' },
            })
            const res = await POST(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(200)
            expect(mockPrisma.meeting_type.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ company_id: 1 }),
                })
            )
        })
    })

    describe('PUT /api/meeting-type', () => {
        it('updates meeting type by id', async () => {
            mockPrisma.meeting_type.update.mockResolvedValue(makeMeetingType({ meeting_type_name: 'Updated' }) as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { id: 1, meetingTypeName: 'Updated' },
            })
            const res = await PUT(req)
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.data.meeting_type_name).toBe('Updated')
        })
    })

    describe('DELETE /api/meeting-type', () => {
        it('returns 400 when id is missing', async () => {
            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'DELETE',
                url: 'http://localhost:3000/api/meeting-type',
            })
            const res = await DELETE(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(400)
        })

        it('deletes meeting type by id', async () => {
            mockPrisma.meeting_type.delete.mockResolvedValue({} as any)

            const req = createAuthRequest(COMPANY_ADMIN_PAYLOAD, {
                method: 'DELETE',
                url: 'http://localhost:3000/api/meeting-type?id=1',
            })
            const res = await DELETE(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(200)
        })
    })
})
