import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const typeId = searchParams.get('typeId')

        const whereClause: any = { is_cancelled: false }

        if (startDate && endDate) {
            whereClause.meeting_date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        }

        if (typeId) {
            whereClause.meeting_type_id = Number(typeId)
        }

        const meetings = await prisma.meetings.findMany({
            where: whereClause,
            include: {
                meeting_type: true,
                meeting_member: true // To count attendance
            },
            orderBy: { meeting_date: 'desc' }
        })

        const report = meetings.map(m => {
            const totalMembers = m.meeting_member.length
            const presentMembers = m.meeting_member.filter(mem => mem.is_present).length

            return {
                id: m.meeting_id,
                date: m.meeting_date,
                type: m.meeting_type?.meeting_type_name || 'General',
                description: m.meeting_description,
                totalMembers,
                presentMembers,
                attendanceRate: totalMembers > 0 ? ((presentMembers / totalMembers) * 100).toFixed(1) + '%' : '0%',
                hasMOM: !!m.document_path
            }
        })

        return NextResponse.json({ data: report })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { message: 'Failed to fetch report' },
            { status: 500 }
        )
    }
}
