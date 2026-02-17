import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET: Super Admin dashboard statistics
 */
export async function GET() {
    try {
        const [
            totalCompanies,
            activeCompanies,
            suspendedCompanies,
            totalUsers,
            pendingRequests,
            approvedRequests,
            rejectedRequests,
            totalMeetings,
            recentRequests
        ] = await Promise.all([
            prisma.companies.count({ where: { deleted_at: null } }),
            prisma.companies.count({ where: { status: 'ACTIVE', deleted_at: null } }),
            prisma.companies.count({ where: { status: 'SUSPENDED', deleted_at: null } }),
            prisma.users.count({ where: { role: { not: 'SUPER_ADMIN' } } }),
            prisma.registration_requests.count({ where: { status: 'PENDING' } }),
            prisma.registration_requests.count({ where: { status: 'APPROVED' } }),
            prisma.registration_requests.count({ where: { status: 'REJECTED' } }),
            prisma.meetings.count(),
            prisma.registration_requests.findMany({
                where: { status: 'PENDING' },
                orderBy: { created_at: 'desc' },
                take: 5
            })
        ])

        return NextResponse.json({
            data: {
                companies: { total: totalCompanies, active: activeCompanies, suspended: suspendedCompanies },
                users: { total: totalUsers },
                requests: { pending: pendingRequests, approved: approvedRequests, rejected: rejectedRequests },
                meetings: { total: totalMeetings },
                recentPendingRequests: recentRequests
            }
        })
    } catch (error) {
        console.error('Stats error:', error)
        return NextResponse.json({ message: 'Failed to fetch stats' }, { status: 500 })
    }
}
