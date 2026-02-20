import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'

export async function POST(req: Request) {
    try {
        const headersList = await headers()
        const requesterId = headersList.get('x-user-id')
        const requesterRole = headersList.get('x-user-role')
        const requesterCompanyId = headersList.get('x-company-id')

        if (!requesterId || !['SUPER_ADMIN', 'COMPANY_ADMIN'].includes(requesterRole || '')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const { userId } = await req.json()

        if (!userId) {
            return NextResponse.json({ message: 'User ID is required' }, { status: 400 })
        }

        const targetUser = await prisma.users.findUnique({
            where: { user_id: Number(userId) }
        })

        if (!targetUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 })
        }

        // Authorization check: Company Admin can only reset their own company's users
        if (requesterRole === 'COMPANY_ADMIN') {
            if (Number(targetUser.company_id) !== Number(requesterCompanyId)) {
                return NextResponse.json({ message: 'Unauthorized to manage this user' }, { status: 403 })
            }
        }

        // Reset MFA
        await prisma.users.update({
            where: { user_id: Number(userId) },
            data: {
                is_mfa_enabled: false,
                mfa_secret: null
            }
        })

        // Audit Log
        await prisma.audit_logs.create({
            data: {
                user_id: Number(requesterId),
                action: 'USER_MFA_RESET',
                entity_type: 'users',
                entity_id: Number(userId),
                company_id: Number(requesterCompanyId) || null,
                details: JSON.stringify({ target_email: targetUser.email, reset_by_role: requesterRole })
            }
        })

        return NextResponse.json({ message: 'MFA reset successfully' })

    } catch (error) {
        console.error('MFA Reset Error:', error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
