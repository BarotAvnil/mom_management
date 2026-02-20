/**
 * @jest-environment node
 */
import { POST as setupMfa } from '@/app/api/auth/mfa/setup/route'
import { POST as verifyMfa } from '@/app/api/auth/mfa/verify/route'
import { POST as validateMfa } from '@/app/api/auth/mfa/validate/route'
import { POST as login } from '@/app/api/auth/login/route'
import prisma from '@/lib/prisma'
import { generateMfaSecret, generateMfaQrCode, verifyMfaToken } from '@/lib/mfa'
import { NextResponse } from 'next/server'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
    users: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
    },
    audit_logs: {
        create: jest.fn(),
    },
}))

// Mock MFA lib
jest.mock('@/lib/mfa', () => ({
    generateMfaSecret: jest.fn(),
    generateMfaQrCode: jest.fn(),
    verifyMfaToken: jest.fn(),
}))

// Mock jwt
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'mock_token'),
    verify: jest.fn(),
}))

const mockRequest = (body: any, headers: any = {}) => {
    return {
        json: async () => body,
        headers: {
            get: (key: string) => headers[key],
        },
    } as unknown as Request
}

describe('MFA Flow', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Setup', () => {
        it('should generate secret and qr code', async () => {
            (prisma.users.findUnique as jest.Mock).mockResolvedValue({ user_id: 1, email: 'test@example.com' });
            (generateMfaSecret as jest.Mock).mockReturnValue('secret');
            (generateMfaQrCode as jest.Mock).mockReturnValue('otpauth://...');

            const req = mockRequest({}, { 'x-user-id': '1' });
            const res = await setupMfa(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data).toEqual({ secret: 'secret', otpauth: 'otpauth://...' });
            expect(prisma.users.update).toHaveBeenCalledWith({
                where: { user_id: 1 },
                data: { mfa_secret: 'secret' },
            });
        });
    });

    describe('Verify', () => {
        it('should enable mfa if code is valid', async () => {
            (prisma.users.findUnique as jest.Mock).mockResolvedValue({ user_id: 1, mfa_secret: 'secret' });
            (verifyMfaToken as jest.Mock).mockReturnValue(true);

            const req = mockRequest({ code: '123456' }, { 'x-user-id': '1' });
            const res = await verifyMfa(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(prisma.users.update).toHaveBeenCalledWith({
                where: { user_id: 1 },
                data: { is_mfa_enabled: true },
            });
        });

        it('should fail if code is invalid', async () => {
            (prisma.users.findUnique as jest.Mock).mockResolvedValue({ user_id: 1, mfa_secret: 'secret' });
            (verifyMfaToken as jest.Mock).mockReturnValue(false);

            const req = mockRequest({ code: 'wrong' }, { 'x-user-id': '1' });
            const res = await verifyMfa(req);

            expect(res.status).toBe(400);
        });
    });
});
