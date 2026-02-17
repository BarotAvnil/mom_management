import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * POST: COMPANY_ADMIN resets a staff member's password
 * Finds the linked user account by staff email and updates the password.
 */
export async function POST(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params
        const staffId = Number(id)

        if (Number.isNaN(staffId)) {
            return NextResponse.json({ message: 'Invalid staff ID' }, { status: 400 })
        }

        const userId = req.headers.get('x-user-id')
        const role = req.headers.get('x-user-role')
        const companyId = req.headers.get('x-company-id')

        if (!userId || !companyId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        // Only COMPANY_ADMIN can reset passwords
        if (role !== 'COMPANY_ADMIN' && role !== 'ADMIN') {
            return NextResponse.json({ message: 'Only Company Admins can reset passwords' }, { status: 403 })
        }

        const { newPassword } = await req.json()

        // Password strength validation
        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 })
        }

        // Find staff member — must belong to caller's company
        const staff = await prisma.staff.findFirst({
            where: {
                staff_id: staffId,
                company_id: Number(companyId),
            },
        })

        if (!staff) {
            return NextResponse.json({ message: 'Staff member not found in your company' }, { status: 404 })
        }

        if (!staff.email) {
            return NextResponse.json({ message: 'Staff member has no linked email account' }, { status: 400 })
        }

        // Find the linked user account
        const user = await prisma.users.findFirst({
            where: {
                email: staff.email,
                company_id: Number(companyId),
            },
        })

        if (!user) {
            return NextResponse.json({ message: 'No user account found for this staff member' }, { status: 404 })
        }

        // Hash and update password
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
                action: 'PASSWORD_RESET_BY_ADMIN',
                user_id: Number(userId),
                entity_type: 'users',
                entity_id: user.user_id,
                details: JSON.stringify({
                    target_email: user.email,
                    target_staff_id: staffId,
                    target_staff_name: staff.staff_name,
                    reset_by_role: role,
                }),
            },
        })

        return NextResponse.json({
            message: `Password reset successfully for ${staff.staff_name}`,
        })
    } catch (error) {
        console.error('Staff password reset error:', error)
        return NextResponse.json({ message: 'Failed to reset password' }, { status: 500 })
    }
}
