import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(req: Request) {
    try {
        const { email } = await req.json()

        if (!email) {
            return NextResponse.json(
                { message: 'Email is required' },
                { status: 400 }
            )
        }

        const user = await prisma.users.findUnique({
            where: { email }
        })

        if (!user) {
            // Don't reveal if user exists or not for security
            return NextResponse.json(
                { message: 'If an account exists with this email, you will receive a password reset link.' },
                { status: 200 }
            )
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex')
        const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

        // Update user with reset token
        await prisma.users.update({
            where: { email },
            data: {
                reset_token: resetToken,
                reset_token_expiry: resetTokenExpiry
            }
        })

        // Log the reset link (Mock email sending)
        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
        console.log('---------------------------------------------------')
        console.log('PASSWORD RESET LINK FOR:', email)
        console.log(resetLink)
        console.log('---------------------------------------------------')

        return NextResponse.json(
            { message: 'If an account exists with this email, you will receive a password reset link.' },
            { status: 200 }
        )

    } catch (error) {
        console.error('Forgot password error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}
