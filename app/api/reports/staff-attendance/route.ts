import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const data = await prisma.meeting_member.findMany({
      include: {
        staff: true
      }
    })

    const report: Record<string, any> = {}

    data.forEach(item => {
      const staffId = item.staff_id

      if (!staffId || !item.staff) {
        return
      }

      if (!report[staffId]) {
        report[staffId] = {
          staff_id: staffId,
          staff_name: item.staff.staff_name,
          total_meetings: 0,
          present: 0,
          absent: 0
        }
      }

      report[staffId].total_meetings += 1
      item.is_present
        ? report[staffId].present++
        : report[staffId].absent++
    })

    return NextResponse.json(Object.values(report))
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch staff attendance report' },
      { status: 500 }
    )
  }
}
