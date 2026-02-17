import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * POST: SUPER_ADMIN resets any user's password
 */
export async function POST(req: Request) {
    try {
        const role = req.headers.get('x-user-role')
        const adminUserId = req.headers.get('x-user-id')

        if (role !== 'SUPER_ADMIN') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        const { userId, newPassword } = await req.json()

        if (!userId) {
            return NextResponse.json({ message: 'User ID is required' }, { status: 400 })
        }

        // Password strength validation
        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 })
        }

        // Find user
        const user = await prisma.users.findUnique({
            where: { user_id: Number(userId) },
        })

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 })
        }

        // Cannot reset another SUPER_ADMIN's password
        if (user.role === 'SUPER_ADMIN' && user.user_id !== Number(adminUserId)) {
            return NextResponse.json({ message: 'Cannot reset another Super Admin\'s password' }, { status: 403 })
        }

        // Hash and update
        const hashedPassword = await bcrypt.hash(newPassword, 12)

        await prisma.users.update({
            where: { user_id: user.user_id },
            data: {
                password: hashedPassword,
                reset_token: null,
                reset_token_expiry: null,
            },
        })

        // Audit log
        await prisma.audit_logs.create({
            data: {
                action: 'PASSWORD_RESET_BY_SUPER_ADMIN',
                user_id: Number(adminUserId),
                entity_type: 'users',
                entity_id: user.user_id,
                details: JSON.stringify({
                    target_email: user.email,
                    target_role: user.role,
                }),
            },
        })

        return NextResponse.json({
            message: `Password reset successfully for ${user.name}`,
        })
    } catch (error) {
        console.error('Super admin password reset error:', error)
        return NextResponse.json({ message: 'Failed to reset password' }, { status: 500 })
    }
}
