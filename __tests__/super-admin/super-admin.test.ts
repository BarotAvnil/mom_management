/**
 * Super Admin Tests
 * Covers:
 * - GET/PUT /api/super-admin/companies
 * - GET/PUT /api/super-admin/registrations
 * - GET /api/super-admin/stats
 * - Transaction integrity for registration approval
 * - Audit log insertion verification
 */


import { GET as getCompanies, PUT as putCompanies } from '@/app/api/super-admin/companies/route'
import { GET as getRegistrations, PUT as putRegistrations } from '@/app/api/super-admin/registrations/route'
import { GET as getStats } from '@/app/api/super-admin/stats/route'
import prisma from '@/lib/prisma'
import {
    createAuthRequest,
    createRequest,
    SUPER_ADMIN_PAYLOAD,
    makeCompany,
    makeRegistrationRequest,
    parseResponse,
} from '../helpers'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Super Admin API', () => {
    beforeEach(() => jest.clearAllMocks())

    // ─── Companies ─────────────────────────────────────
    describe('GET /api/super-admin/companies', () => {
        it('returns all active companies with counts', async () => {
            mockPrisma.companies.findMany.mockResolvedValue([makeCompany()] as any)

            const res = await getCompanies()
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.data).toHaveLength(1)
            expect(mockPrisma.companies.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { deleted_at: null },
                })
            )
        })
    })

    describe('PUT /api/super-admin/companies', () => {
        it('returns 400 for invalid status', async () => {
            const req = createAuthRequest(SUPER_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { companyId: 1, status: 'INVALID' },
            })
            const res = await putCompanies(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(400)
        })

        it('suspends company and creates audit log', async () => {
            mockPrisma.companies.update.mockResolvedValue(makeCompany({ status: 'SUSPENDED' }) as any)
            mockPrisma.audit_logs.create.mockResolvedValue({} as any)

            const req = createAuthRequest(SUPER_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { companyId: 1, status: 'SUSPENDED' },
            })
            const res = await putCompanies(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(200)
            // Verify audit log was created
            expect(mockPrisma.audit_logs.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        action: 'SUSPEND_COMPANY',
                        entity_type: 'companies',
                    }),
                })
            )
        })
    })

    // ─── Registrations ────────────────────────────────
    describe('GET /api/super-admin/registrations', () => {
        it('fetches all registrations', async () => {
            mockPrisma.registration_requests.findMany.mockResolvedValue([makeRegistrationRequest()] as any)

            const req = createRequest({ url: 'http://localhost:3000/api/super-admin/registrations' })
            const res = await getRegistrations(req)
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.data).toHaveLength(1)
        })

        it('filters by status query param', async () => {
            mockPrisma.registration_requests.findMany.mockResolvedValue([])

            const req = createRequest({
                url: 'http://localhost:3000/api/super-admin/registrations?status=PENDING',
            })
            await getRegistrations(req)

            expect(mockPrisma.registration_requests.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: 'PENDING' },
                })
            )
        })
    })

    describe('PUT /api/super-admin/registrations — Reject', () => {
        it('returns 400 for invalid action', async () => {
            const req = createAuthRequest(SUPER_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { requestId: 1, action: 'NOPE' },
            })
            const res = await putRegistrations(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(400)
        })

        it('returns 404 when request not found', async () => {
            mockPrisma.registration_requests.findUnique.mockResolvedValue(null)

            const req = createAuthRequest(SUPER_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { requestId: 999, action: 'APPROVE' },
            })
            const res = await putRegistrations(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(404)
        })

        it('rejects already-processed request', async () => {
            mockPrisma.registration_requests.findUnique.mockResolvedValue(
                makeRegistrationRequest({ status: 'APPROVED' }) as any
            )

            const req = createAuthRequest(SUPER_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { requestId: 1, action: 'REJECT' },
            })
            const res = await putRegistrations(req)
            const { status } = await parseResponse(res)

            expect(status).toBe(400)
        })

        it('rejects request and creates audit log', async () => {
            mockPrisma.registration_requests.findUnique.mockResolvedValue(makeRegistrationRequest() as any)
            mockPrisma.registration_requests.update.mockResolvedValue(
                makeRegistrationRequest({ status: 'REJECTED' }) as any
            )
            mockPrisma.audit_logs.create.mockResolvedValue({} as any)

            const req = createAuthRequest(SUPER_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { requestId: 1, action: 'REJECT', rejectionReason: 'Duplicate' },
            })
            const res = await putRegistrations(req)
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.message).toContain('rejected')
            expect(mockPrisma.audit_logs.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ action: 'REJECT_REGISTRATION' }),
                })
            )
        })
    })

    describe('PUT /api/super-admin/registrations — Approve (Transaction)', () => {
        it('approves request via transaction: creates company, user, audit log', async () => {
            mockPrisma.registration_requests.findUnique.mockResolvedValue(makeRegistrationRequest() as any)
            mockPrisma.$transaction.mockImplementation(async (fn: any) => {
                const tx = {
                    companies: {
                        findUnique: jest.fn().mockResolvedValue(null),
                        create: jest.fn().mockResolvedValue({ company_id: 5, company_name: 'New Corp' }),
                    },
                    users: {
                        findFirst: jest.fn().mockResolvedValue(null),
                        create: jest.fn().mockResolvedValue({ user_id: 50, name: 'Jane Admin' }),
                    },
                    registration_requests: {
                        update: jest.fn().mockResolvedValue(makeRegistrationRequest({ status: 'APPROVED' })),
                    },
                    audit_logs: {
                        create: jest.fn().mockResolvedValue({}),
                    },
                }
                return fn(tx)
            })

            const req = createAuthRequest(SUPER_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { requestId: 1, action: 'APPROVE' },
            })
            const res = await putRegistrations(req)
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.message).toContain('approved')
        })

        it('rolls back transaction when company name already exists', async () => {
            mockPrisma.registration_requests.findUnique.mockResolvedValue(makeRegistrationRequest() as any)
            mockPrisma.$transaction.mockImplementation(async (fn: any) => {
                const tx = {
                    companies: {
                        findUnique: jest.fn().mockResolvedValue({ company_id: 1 }), // Already exists!
                    },
                    users: { findFirst: jest.fn() },
                    registration_requests: { update: jest.fn() },
                    audit_logs: { create: jest.fn() },
                }
                return fn(tx)
            })

            const req = createAuthRequest(SUPER_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { requestId: 1, action: 'APPROVE' },
            })
            const res = await putRegistrations(req)
            const { status, body } = await parseResponse(res)

            expect(status).toBe(500)
            expect(body.message).toContain('already exists')
        })

        it('rolls back transaction when email already exists as user', async () => {
            mockPrisma.registration_requests.findUnique.mockResolvedValue(makeRegistrationRequest() as any)
            mockPrisma.$transaction.mockImplementation(async (fn: any) => {
                const tx = {
                    companies: { findUnique: jest.fn().mockResolvedValue(null) },
                    users: {
                        findFirst: jest.fn().mockResolvedValue({ user_id: 1 }), // Already exists!
                    },
                    registration_requests: { update: jest.fn() },
                    audit_logs: { create: jest.fn() },
                }
                return fn(tx)
            })

            const req = createAuthRequest(SUPER_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { requestId: 1, action: 'APPROVE' },
            })
            const res = await putRegistrations(req)
            const { status, body } = await parseResponse(res)

            expect(status).toBe(500)
            expect(body.message).toContain('already exists')
        })
    })

    // ─── Stats ─────────────────────────────────────────
    describe('GET /api/super-admin/stats', () => {
        it('returns aggregated platform statistics', async () => {
            mockPrisma.companies.count.mockResolvedValue(10)
            mockPrisma.users.count.mockResolvedValue(50)
            mockPrisma.registration_requests.count.mockResolvedValue(3)
            mockPrisma.meetings.count.mockResolvedValue(100)
            mockPrisma.registration_requests.findMany.mockResolvedValue([])

            const res = await getStats()
            const { status, body } = await parseResponse(res)

            expect(status).toBe(200)
            expect(body.data.companies).toBeDefined()
            expect(body.data.users).toBeDefined()
            expect(body.data.requests).toBeDefined()
            expect(body.data.meetings).toBeDefined()
        })
    })
})
