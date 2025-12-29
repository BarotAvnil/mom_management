import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  req: Request,
  context: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await context.params
    const meetingIdNumber = Number(meetingId)

    if (Number.isNaN(meetingIdNumber)) {
      return NextResponse.json(
        { message: 'Invalid meeting id' },
        { status: 400 }
      )
    }

    const attendance = await prisma.meeting_member.findMany({
      where: {
        meeting_id: meetingIdNumber,
        staff_id: { not: null }   // ✅ IMPORTANT
      },
      include: {
        staff: true               // ✅ REQUIRED FOR UI
      }
    })


    return NextResponse.json({
      message: 'Attendance fetched successfully',
      data: attendance
    })
  } catch (error) {
    console.error('GET attendance error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch attendance' },
      { status: 500 }
    )
  }
}
