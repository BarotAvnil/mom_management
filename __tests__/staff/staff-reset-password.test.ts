import prisma from '@/lib/prisma'
import { POST } from '@/app/api/staff/[id]/reset-password/route'
import { createAuthRequest, makeStaff, makeUser } from '../helpers'

describe('POST /api/staff/:id/reset-password', () => {
    beforeEach(() => jest.clearAllMocks())

    const adminPayload = { userId: '1', role: 'COMPANY_ADMIN', companyId: '10' }

    it('returns 400 for NaN staff ID', async () => {
        const req = createAuthRequest(adminPayload, {
            method: 'POST',
            body: { newPassword: 'Test1234' },
        })
        const res = await POST(req, { params: Promise.resolve({ id: 'abc' }) })
        expect(res.status).toBe(400)
        const json = await res.json()
        expect(json.message).toBe('Invalid staff ID')
    })

    it('returns 403 for MEMBER role', async () => {
        const req = createAuthRequest(
            { userId: '1', role: 'MEMBER', companyId: '10' },
            { method: 'POST', body: { newPassword: 'Test1234' } }
        )
        const res = await POST(req, { params: Promise.resolve({ id: '5' }) })
        expect(res.status).toBe(403)
        const json = await res.json()
        expect(json.message).toContain('Only Company Admins')
    })

    it('returns 400 for weak password (too short)', async () => {
        const req = createAuthRequest(adminPayload, {
            method: 'POST',
            body: { newPassword: 'Ab1' },
        })
        const res = await POST(req, { params: Promise.resolve({ id: '5' }) })
        expect(res.status).toBe(400)
        const json = await res.json()
        expect(json.message).toContain('8 characters')
    })

    it('returns 400 for password without uppercase', async () => {
        const req = createAuthRequest(adminPayload, {
            method: 'POST',
            body: { newPassword: 'abcdefg1' },
        })
        const res = await POST(req, { params: Promise.resolve({ id: '5' }) })
        expect(res.status).toBe(400)
        const json = await res.json()
        expect(json.message).toContain('uppercase')
    })

    it('returns 400 for password without digit', async () => {
        const req = createAuthRequest(adminPayload, {
            method: 'POST',
            body: { newPassword: 'Abcdefgh' },
        })
        const res = await POST(req, { params: Promise.resolve({ id: '5' }) })
        expect(res.status).toBe(400)
        const json = await res.json()
        expect(json.message).toContain('digit')
    })

    it('returns 404 when staff not in company', async () => {
        ; (prisma.staff.findFirst as jest.Mock).mockResolvedValue(null)

        const req = createAuthRequest(adminPayload, {
            method: 'POST',
            body: { newPassword: 'StrongPass1' },
        })
        const res = await POST(req, { params: Promise.resolve({ id: '5' }) })
        expect(res.status).toBe(404)
        const json = await res.json()
        expect(json.message).toContain('not found')
    })

    it('returns 404 when no linked user account', async () => {
        ; (prisma.staff.findFirst as jest.Mock).mockResolvedValue(
            makeStaff({ staff_id: 5, email: 'test@co.com', company_id: 10 })
        )
            ; (prisma.users.findFirst as jest.Mock).mockResolvedValue(null)

        const req = createAuthRequest(adminPayload, {
            method: 'POST',
            body: { newPassword: 'StrongPass1' },
        })
        const res = await POST(req, { params: Promise.resolve({ id: '5' }) })
        expect(res.status).toBe(404)
        const json = await res.json()
        expect(json.message).toContain('No user account')
    })

    it('resets password successfully with audit log', async () => {
        ; (prisma.staff.findFirst as jest.Mock).mockResolvedValue(
            makeStaff({ staff_id: 5, email: 'john@co.com', company_id: 10, staff_name: 'John' })
        )
            ; (prisma.users.findFirst as jest.Mock).mockResolvedValue(
                makeUser({ user_id: 20, email: 'john@co.com', company_id: 10 })
            )
            ; (prisma.users.update as jest.Mock).mockResolvedValue({})
            ; (prisma.audit_logs.create as jest.Mock).mockResolvedValue({})

        const req = createAuthRequest(adminPayload, {
            method: 'POST',
            body: { newPassword: 'StrongPass1' },
        })
        const res = await POST(req, { params: Promise.resolve({ id: '5' }) })
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.message).toContain('John')

        // Verify password was hashed
        const updateCall = (prisma.users.update as jest.Mock).mock.calls[0][0]
        expect(updateCall.data.password).toBeDefined()
        expect(updateCall.data.password).not.toBe('StrongPass1')
        expect(updateCall.data.reset_token).toBeNull()

        // Verify audit log
        expect(prisma.audit_logs.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    action: 'PASSWORD_RESET_BY_ADMIN',
                    entity_type: 'users',
                    entity_id: 20,
                }),
            })
        )
    })

    it('returns 500 on unexpected error', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => { })
            ; (prisma.staff.findFirst as jest.Mock).mockRejectedValue(new Error('DB down'))

        const req = createAuthRequest(adminPayload, {
            method: 'POST',
            body: { newPassword: 'StrongPass1' },
        })
        const res = await POST(req, { params: Promise.resolve({ id: '5' }) })
        expect(res.status).toBe(500)
    })
})
