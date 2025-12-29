import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const data = await prisma.meeting_member.groupBy({
      by: ['meeting_id'],
      _count: {
        meeting_member_id: true,
        is_present: true
      }
    })

    const report = data.map(item => {
      const present = item._count.is_present ?? 0
      const total = item._count.meeting_member_id
      const absent = total - present

      return {
        meeting_id: item.meeting_id,
        total_members: total,
        present,
        absent,
        attendance_percentage: total
          ? ((present / total) * 100).toFixed(2)
          : '0'
      }
    })

    return NextResponse.json(report)
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch attendance report' },
      { status: 500 }
    )
  }
}
