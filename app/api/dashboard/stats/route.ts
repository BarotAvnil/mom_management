import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const userId = req.headers.get('x-user-id')
        const role = req.headers.get('x-user-role')

        const totalMeetings = await prisma.meetings.count()
        const cancelledMeetings = await prisma.meetings.count({
            where: { is_cancelled: true }
        })

        // Pending MOM: Past meetings that are not cancelled and have no document
        const pendingMOM = await prisma.meetings.count({
            where: {
                AND: [
                    { meeting_date: { lt: new Date() } },
                    { is_cancelled: false },
                    { OR: [{ document_path: null }, { document_path: '' }] }
                ]
            }
        })

        // Build Where Clause for Upcoming
        let whereClause: any = {
            meeting_date: { gte: new Date() },
            is_cancelled: false
        }

        if (role !== 'ADMIN' && userId) {
            // Find staff record for this user (by email) to check attendance
            // We need to fetch user email first
            const user = await prisma.users.findUnique({ where: { user_id: Number(userId) } })

            let staffId = null
            if (user?.email) {
                const staff = await prisma.staff.findFirst({ where: { email: user.email } })
                if (staff) staffId = staff.staff_id
            }

            whereClause = {
                ...whereClause,
                OR: [
                    { created_by: Number(userId) }, // Created by me
                    ...(staffId ? [{ meeting_member: { some: { staff_id: staffId } } }] : []) // Attending
                ]
            }
        }

        const upcomingMeetings = await prisma.meetings.findMany({
            where: whereClause,
            orderBy: { meeting_date: 'asc' },
            take: 5,
            include: {
                meeting_type: true
            }
        })

        const recentMOMs = await prisma.meetings.findMany({
            where: {
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
