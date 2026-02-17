/**
 * Audit & Logging Validation Tests
 * 
 * Verifies that audit_logs are created on critical actions:
 * - Registration approval/rejection
 * - Company suspension/activation
 * - Ensures audit log metadata correctness
 */


import { PUT as putCompanies } from '@/app/api/super-admin/companies/route'
import { PUT as putRegistrations } from '@/app/api/super-admin/registrations/route'
import prisma from '@/lib/prisma'
import {
    createAuthRequest,
    SUPER_ADMIN_PAYLOAD,
    makeCompany,
    makeRegistrationRequest,
    parseResponse,
} from '../helpers'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Audit & Logging Validation', () => {
    beforeEach(() => jest.clearAllMocks())

    // ─── Company Status Changes ────────────────────────
    describe('Company status change audit trails', () => {
        it('creates audit log with SUSPEND_COMPANY action', async () => {
            mockPrisma.companies.update.mockResolvedValue(makeCompany({ status: 'SUSPENDED' }) as any)
            mockPrisma.audit_logs.create.mockResolvedValue({} as any)

            const req = createAuthRequest(SUPER_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { companyId: 1, status: 'SUSPENDED' },
            })
            await putCompanies(req)

            expect(mockPrisma.audit_logs.create).toHaveBeenCalledTimes(1)
            expect(mockPrisma.audit_logs.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    user_id: SUPER_ADMIN_PAYLOAD.id,
                    action: 'SUSPEND_COMPANY',
                    entity_type: 'companies',
                    entity_id: 1,
                    company_id: 1,
                    details: expect.stringContaining('SUSPENDED'),
                }),
            })
        })

        it('creates audit log with ACTIVATE_COMPANY action', async () => {
            mockPrisma.companies.update.mockResolvedValue(makeCompany({ status: 'ACTIVE' }) as any)
            mockPrisma.audit_logs.create.mockResolvedValue({} as any)

            const req = createAuthRequest(SUPER_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { companyId: 1, status: 'ACTIVE' },
            })
            await putCompanies(req)

            expect(mockPrisma.audit_logs.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    action: 'ACTIVATE_COMPANY',
                }),
            })
        })
    })

    // ─── Registration Rejection Audit ─────────────────
    describe('Registration rejection audit trail', () => {
        it('logs REJECT_REGISTRATION with reason in metadata', async () => {
            mockPrisma.registration_requests.findUnique.mockResolvedValue(makeRegistrationRequest() as any)
            mockPrisma.registration_requests.update.mockResolvedValue(
                makeRegistrationRequest({ status: 'REJECTED' }) as any
            )
            mockPrisma.audit_logs.create.mockResolvedValue({} as any)

            const req = createAuthRequest(SUPER_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { requestId: 1, action: 'REJECT', rejectionReason: 'Fraudulent' },
            })
            await putRegistrations(req)

            expect(mockPrisma.audit_logs.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    action: 'REJECT_REGISTRATION',
                    entity_type: 'registration_requests',
                    entity_id: 1,
                    details: expect.stringContaining('Fraudulent'),
                }),
            })
        })
    })

    // ─── Registration Approval Audit (Transaction) ────
    describe('Registration approval audit trail', () => {
        it('creates audit log inside transaction on approval', async () => {
            mockPrisma.registration_requests.findUnique.mockResolvedValue(makeRegistrationRequest() as any)

            const txAuditCreate = jest.fn().mockResolvedValue({})
            mockPrisma.$transaction.mockImplementation(async (fn: any) => {
                const tx = {
                    companies: {
                        findUnique: jest.fn().mockResolvedValue(null),
                        create: jest.fn().mockResolvedValue({ company_id: 5, company_name: 'New Corp' }),
                    },
                    users: {
                        findFirst: jest.fn().mockResolvedValue(null),
                        create: jest.fn().mockResolvedValue({ user_id: 50 }),
                    },
                    registration_requests: {
                        update: jest.fn().mockResolvedValue(makeRegistrationRequest({ status: 'APPROVED' })),
                    },
                    audit_logs: { create: txAuditCreate },
                }
                return fn(tx)
            })

            const req = createAuthRequest(SUPER_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { requestId: 1, action: 'APPROVE' },
            })
            await putRegistrations(req)

            expect(txAuditCreate).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    action: 'APPROVE_REGISTRATION',
                    entity_type: 'registration_requests',
                    company_id: 5,
                    details: expect.stringContaining('New Corp'),
                }),
            })
        })
    })

    // ─── Audit Cannot Be Bypassed ─────────────────────
    describe('Audit log cannot be bypassed', () => {
        it('audit creation is always called even when main operation succeeds', async () => {
            mockPrisma.companies.update.mockResolvedValue(makeCompany() as any)
            mockPrisma.audit_logs.create.mockResolvedValue({} as any)

            const req = createAuthRequest(SUPER_ADMIN_PAYLOAD, {
                method: 'PUT',
                body: { companyId: 1, status: 'SUSPENDED' },
            })
            await putCompanies(req)

            // Audit log must always be created
            expect(mockPrisma.audit_logs.create).toHaveBeenCalledTimes(1)
        })
    })
})
