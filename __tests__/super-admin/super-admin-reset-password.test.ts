import prisma from '@/lib/prisma'
import { POST } from '@/app/api/super-admin/reset-password/route'
import { createAuthRequest, makeUser } from '../helpers'

describe('POST /api/super-admin/reset-password', () => {
    beforeEach(() => jest.clearAllMocks())

    const superPayload = { userId: '1', role: 'SUPER_ADMIN', companyId: '' }

    it('returns 403 for non-SUPER_ADMIN', async () => {
        const req = createAuthRequest(
            { userId: '1', role: 'COMPANY_ADMIN', companyId: '10' },
            { method: 'POST', body: { userId: 5, newPassword: 'Test1234' } }
        )
        const res = await POST(req)
        expect(res.status).toBe(403)
    })

    it('returns 400 when userId missing', async () => {
        const req = createAuthRequest(superPayload, {
            method: 'POST',
            body: { newPassword: 'Test1234' },
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        const json = await res.json()
        expect(json.message).toContain('User ID')
    })

    it('returns 400 for weak password', async () => {
        const req = createAuthRequest(superPayload, {
            method: 'POST',
            body: { userId: 5, newPassword: 'weak' },
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
        const json = await res.json()
        expect(json.message).toContain('8 characters')
    })

    it('returns 404 when user not found', async () => {
        ; (prisma.users.findUnique as jest.Mock).mockResolvedValue(null)

        const req = createAuthRequest(superPayload, {
            method: 'POST',
            body: { userId: 999, newPassword: 'StrongPass1' },
        })
        const res = await POST(req)
        expect(res.status).toBe(404)
    })

    it('prevents resetting another SUPER_ADMIN password', async () => {
        ; (prisma.users.findUnique as jest.Mock).mockResolvedValue(
            makeUser({ user_id: 99, role: 'SUPER_ADMIN' })
        )

        const req = createAuthRequest(superPayload, {
            method: 'POST',
            body: { userId: 99, newPassword: 'StrongPass1' },
        })
        const res = await POST(req)
        expect(res.status).toBe(403)
        const json = await res.json()
        expect(json.message).toContain('Super Admin')
    })

    it('resets password successfully with audit log', async () => {
        ; (prisma.users.findUnique as jest.Mock).mockResolvedValue(
            makeUser({ user_id: 20, name: 'Alice', email: 'alice@co.com', role: 'COMPANY_ADMIN' })
        )
            ; (prisma.users.update as jest.Mock).mockResolvedValue({})
            ; (prisma.audit_logs.create as jest.Mock).mockResolvedValue({})

        const req = createAuthRequest(superPayload, {
            method: 'POST',
            body: { userId: 20, newPassword: 'StrongPass1' },
        })
        const res = await POST(req)
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.message).toContain('Alice')

        // Verify password was hashed
        const updateCall = (prisma.users.update as jest.Mock).mock.calls[0][0]
        expect(updateCall.data.password).not.toBe('StrongPass1')
        expect(updateCall.data.reset_token).toBeNull()

        // Verify audit log
        expect(prisma.audit_logs.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    action: 'PASSWORD_RESET_BY_SUPER_ADMIN',
                    entity_type: 'users',
                }),
            })
        )
    })

    it('returns 500 on unexpected error', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => { })
            ; (prisma.users.findUnique as jest.Mock).mockRejectedValue(new Error('DB down'))

        const req = createAuthRequest(superPayload, {
            method: 'POST',
            body: { userId: 5, newPassword: 'StrongPass1' },
        })
        const res = await POST(req)
        expect(res.status).toBe(500)
    })
})
