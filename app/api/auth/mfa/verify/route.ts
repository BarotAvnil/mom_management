import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyMfaToken } from '@/lib/mfa';

export async function POST(req: Request) {
    try {
        const userId = req.headers.get('x-user-id');
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { code } = await req.json();
        if (!code) return NextResponse.json({ message: 'Code is required' }, { status: 400 });

        const user = await prisma.users.findUnique({
            where: { user_id: Number(userId) },
        });

        if (!user || !user.mfa_secret) {
            return NextResponse.json({ message: 'MFA setup not initialized' }, { status: 400 });
        }

        const isValid = await verifyMfaToken(code, user.mfa_secret);

        if (!isValid) {
            return NextResponse.json({ message: 'Invalid code' }, { status: 400 });
        }

        await prisma.users.update({
            where: { user_id: Number(userId) },
            data: { is_mfa_enabled: true },
        });

        return NextResponse.json({ message: 'MFA enabled successfully' });
    } catch (error) {
        console.error('MFA Verify Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
