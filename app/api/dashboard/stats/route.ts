import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const userId = req.headers.get('x-user-id')
        const role = req.headers.get('x-user-role')

        let baseWhere: any = {}

        if (role !== 'ADMIN' && userId) {
            // Determine Staff ID
            const user = await prisma.users.findUnique({ where: { user_id: Number(userId) } })
            let staffId = null
            if (user?.email) {
                const staff = await prisma.staff.findFirst({ where: { email: user.email } })
                if (staff) staffId = staff.staff_id
            }

            baseWhere = {
                OR: [
                    { created_by: Number(userId) },
                    ...(staffId ? [{ meeting_member: { some: { staff_id: staffId } } }] : [])
                ]
            }
        }

        // Apply filters to all counts
        const totalMeetings = await prisma.meetings.count({
            where: baseWhere
        })

        const cancelledMeetings = await prisma.meetings.count({
            where: {
                ...baseWhere,
                is_cancelled: true
            }
        })

        // Pending MOM: Stricter filter - only if I am responsible (Creator or Meeting Admin)
        let pendingWhere = { ...baseWhere }

        if (role !== 'ADMIN' && userId) {
            // override baseWhere for "Pending MOM" to be "Actionable" items only
            pendingWhere = {
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

        // Logic: Show meetings starting from "Start of Today" so users can see today's schedule even if time passed
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const now = new Date()

        // Ongoing: Started today, not separated, not cancelled, <= NOW
        const ongoingMeetings = await prisma.meetings.findMany({
            where: {
                ...baseWhere,
                meeting_date: {
                    gte: startOfDay,
                    lte: now
                },
                is_cancelled: false,
                is_completed: false // Only active ones
            },
            orderBy: { meeting_date: 'asc' },
            include: { meeting_type: true }
        })

        // Upcoming: Strictly in the future
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
