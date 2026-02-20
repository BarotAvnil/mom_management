import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { verifyMfaToken } from '@/lib/mfa';

export async function POST(req: Request) {
    try {
        const { tempToken, code } = await req.json();

        if (!tempToken || !code) {
            return NextResponse.json({ message: 'Token and code are required' }, { status: 400 });
        }

        // Verify temp token
        let decoded: any;
        try {
            decoded = jwt.verify(tempToken, process.env.JWT_SECRET as string);
        } catch (err) {
            return NextResponse.json({ message: 'Invalid or expired session' }, { status: 401 });
        }

        if (!decoded.temp || !decoded.id) {
            return NextResponse.json({ message: 'Invalid token type' }, { status: 401 });
        }

        const user = await prisma.users.findUnique({
            where: { user_id: decoded.id },
            include: { company: true }
        });

        if (!user || !user.mfa_secret) {
            return NextResponse.json({ message: 'User not found or MFA not setup' }, { status: 404 });
        }

        const isValid = await verifyMfaToken(code, user.mfa_secret);

        if (!isValid) {
            return NextResponse.json({ message: 'Invalid MFA code' }, { status: 401 });
        }

        // Generate final JWT
        const token = jwt.sign(
            {
                id: user.user_id,
                role: user.role,
                company_id: user.company_id // null for SUPER_ADMIN
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' }
        );

        const response = NextResponse.json({
            message: 'Login successful',
            token,
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
                company_id: user.company_id,
                company_name: user.company?.company_name || null
            }
        });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 86400,
            path: '/'
        });

        // Audit log for login
        await prisma.audit_logs.create({
            data: {
                user_id: user.user_id,
                action: 'USER_LOGIN_MFA',
                entity_type: 'users',
                entity_id: user.user_id,
                company_id: user.company_id,
                details: JSON.stringify({ role: user.role, ip: req.headers.get('x-forwarded-for') || 'unknown' })
            }
        });

        return response;

    } catch (error) {
        console.error('MFA Validate Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
