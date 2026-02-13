import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json()

        if (!token || !password) {
            return NextResponse.json(
                { message: 'Token and password are required' },
                { status: 400 }
            )
        }

        // Find user with valid token
        const user = await prisma.users.findFirst({
            where: {
                reset_token: token,
                reset_token_expiry: {
                    gt: new Date()
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { message: 'Invalid or expired reset token' },
                { status: 400 }
            )
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Update user password and clear token
        await prisma.users.update({
            where: { user_id: user.user_id },
            data: {
                password: hashedPassword,
                reset_token: null,
                reset_token_expiry: null
            }
        })

        return NextResponse.json(
            { message: 'Password reset successfully' },
            { status: 200 }
        )

    } catch (error) {
        console.error('Reset password error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}
