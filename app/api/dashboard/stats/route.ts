import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const userId = req.headers.get('x-user-id')
        const role = req.headers.get('x-user-role')
        const companyId = req.headers.get('x-company-id')

        let baseWhere: any = {}

        // Company isolation
        if (!companyId) {
            return NextResponse.json({ success: true, data: { stats: { total: 0, cancelled: 0, pendingMOM: 0 }, ongoing: [], upcoming: [], recentMOMs: [] } })
        }
        baseWhere.company_id = Number(companyId)

        // Role-based filtering within company
        if (role !== 'ADMIN' && role !== 'COMPANY_ADMIN' && userId) {
            const user = await prisma.users.findUnique({ where: { user_id: Number(userId) } })
            let staffId = null
            if (user?.email) {
                const staff = await prisma.staff.findFirst({ where: { email: user.email } })
                if (staff) staffId = staff.staff_id
            }

            baseWhere = {
                ...baseWhere,
                OR: [
                    { created_by: Number(userId) },
                    ...(staffId ? [{ meeting_member: { some: { staff_id: staffId } } }] : [])
                ]
            }
        }

        const totalMeetings = await prisma.meetings.count({
            where: baseWhere
        })

        const cancelledMeetings = await prisma.meetings.count({
            where: {
                ...baseWhere,
                is_cancelled: true
            }
        })

        let pendingWhere = { ...baseWhere }

        if (role !== 'ADMIN' && role !== 'COMPANY_ADMIN' && userId) {
            pendingWhere = {
                ...baseWhere,
                OR: [
                    { created_by: Number(userId) },
                    { meeting_admin_id: Number(userId) }
                ]
            }
        }

        const pendingMOM = await prisma.meetings.count({
            where: {
                ...pendingWhere,
                meeting_date: { lt: new Date() },
                is_cancelled: false,
                OR: [{ document_path: null }, { document_path: '' }]
            }
        })

        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const now = new Date()

        const ongoingMeetings = await prisma.meetings.findMany({
            where: {
                ...baseWhere,
                meeting_date: {
                    gte: startOfDay,
                    lte: now
                },
                is_cancelled: false,
                is_completed: false
            },
            orderBy: { meeting_date: 'asc' },
            include: { meeting_type: true }
        })

        const upcomingMeetings = await prisma.meetings.findMany({
            where: {
                ...baseWhere,
                meeting_date: { gt: now },
                is_cancelled: false
            },
            orderBy: { meeting_date: 'asc' },
            take: 5,
            include: {
                meeting_type: true
            }
        })

        const recentMOMs = await prisma.meetings.findMany({
            where: {
                ...baseWhere,
                document_path: { not: null }
            },
            orderBy: { updated_at: 'desc' },
            take: 5
        })

        return NextResponse.json({
            success: true,
            data: {
                stats: {
                    total: totalMeetings,
                    cancelled: cancelledMeetings,
                    pendingMOM
                },
                ongoing: ongoingMeetings,
                upcoming: upcomingMeetings,
                recentMOMs
            }
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { message: 'Failed to fetch dashboard stats' },
            { status: 500 }
        )
    }
}
