import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET: fetch all meetings
// GET: fetch all meetings (Filtered by Role)
export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id')
    const role = req.headers.get('x-user-role')

    let whereClause: any = {}

    if (role !== 'ADMIN' && userId) {
      // Find staff record for this user (by email) to check attendance
      const user = await prisma.users.findUnique({ where: { user_id: Number(userId) } })

      let staffId = null
      if (user?.email) {
        const staff = await prisma.staff.findFirst({ where: { email: user.email } })
        if (staff) staffId = staff.staff_id
      }

      whereClause = {
        OR: [
          { created_by: Number(userId) }, // Created by me
          { meeting_admin_id: Number(userId) }, // I am the Meeting Admin
          ...(staffId ? [{ meeting_member: { some: { staff_id: staffId } } }] : []) // Attending
        ]
      }
    }

    const meetings = await prisma.meetings.findMany({
      where: whereClause,
      include: {
        meeting_type: true
      },
      orderBy: { meeting_date: 'desc' }
    })

    return NextResponse.json({ data: meetings })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: 'Failed to fetch meetings' },
      { status: 500 }
    )
  }
}

// POST: create a meeting
export async function POST(req: Request) {
  try {
    const role = req.headers.get('x-user-role')
    if (role !== 'ADMIN' && role !== 'CONVENER') {
      return NextResponse.json({ message: 'Forbidden: Admins and Conveners only' }, { status: 403 })
    }

    const { meetingDate, meetingTypeId, description, staffIds, meetingAdminId } = await req.json()

    if (!meetingDate || !meetingTypeId) {
      return NextResponse.json(
        { message: 'Meeting date and meeting type are required' },
        { status: 400 }
      )
    }

    const userId = req.headers.get('x-user-id')

    // Transaction to create meeting and members
    const meeting = await prisma.$transaction(async (tx) => {
      const m = await tx.meetings.create({
        data: {
          meeting_date: new Date(meetingDate),
          meeting_type_id: meetingTypeId,
          meeting_description: description,
          created_by: userId ? Number(userId) : null,
          meeting_admin_id: meetingAdminId ? Number(meetingAdminId) : null
        }
      })

      if (staffIds && Array.isArray(staffIds) && staffIds.length > 0) {
        await tx.meeting_member.createMany({
          data: staffIds.map((sid: any) => ({
            meeting_id: m.meeting_id,
            staff_id: Number(sid),
            is_present: false
          }))
        })
      }

      return m
    })

    return NextResponse.json({
      message: 'Meeting created successfully',
      data: meeting
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: 'Failed to create meeting' },
      { status: 500 }
    )
  }
}
