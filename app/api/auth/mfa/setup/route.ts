import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateMfaSecret, generateMfaQrCode } from '@/lib/mfa';

export async function POST(req: Request) {
    try {
        const userId = req.headers.get('x-user-id');
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const user = await prisma.users.findUnique({
            where: { user_id: Number(userId) },
        });

        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        const secret = generateMfaSecret();
        const otpauth = generateMfaQrCode(user.email, secret);

        // Store the secret temporarily (or permanently, but enabled=false)
        await prisma.users.update({
            where: { user_id: Number(userId) },
            data: { mfa_secret: secret },
        });

        return NextResponse.json({ secret, otpauth });
    } catch (error) {
        console.error('MFA Setup Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
