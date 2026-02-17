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

    // VISIBILITY CHECK
    const userId = req.headers.get('x-user-id')
    const role = req.headers.get('x-user-role')

    if (role !== 'ADMIN' && role !== 'COMPANY_ADMIN') {
      const meeting = await prisma.meetings.findUnique({
        where: { meeting_id: meetingIdNumber },
        include: { meeting_member: true }
      })

      if (!meeting) return NextResponse.json({ message: 'Meeting not found' }, { status: 404 })

      const isCreator = meeting.created_by === Number(userId)
      const isMeetingAdmin = meeting.meeting_admin_id === Number(userId)

      let isInvited = false
      if (userId) {
        const user = await prisma.users.findUnique({ where: { user_id: Number(userId) } })
        if (user?.email) {
          const staff = await prisma.staff.findFirst({ where: { email: user.email } })
          if (staff) {
            isInvited = meeting.meeting_member.some(m => m.staff_id === staff.staff_id)
          }
        }
      }

      if (!isCreator && !isMeetingAdmin && !isInvited) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      }
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
