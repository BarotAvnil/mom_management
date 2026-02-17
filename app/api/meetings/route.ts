import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET: fetch all meetings (filtered by company_id + role)
export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id')
    const role = req.headers.get('x-user-role')
    const companyId = req.headers.get('x-company-id')

    let whereClause: any = {}

    // Company isolation — each company sees only their own meetings
    if (!companyId) {
      // SUPER_ADMIN or users without company see nothing in tenant routes
      return NextResponse.json({ data: [] })
    }
    whereClause.company_id = Number(companyId)

    // Role-based visibility within company
    if (role !== 'ADMIN' && role !== 'COMPANY_ADMIN' && userId) {
      const user = await prisma.users.findUnique({ where: { user_id: Number(userId) } })

      let staffId = null
      if (user?.email) {
        const staff = await prisma.staff.findFirst({ where: { email: user.email } })
        if (staff) staffId = staff.staff_id
      }

      whereClause = {
        ...whereClause,
        OR: [
          { created_by: Number(userId) },
          { meeting_admin_id: Number(userId) },
          ...(staffId ? [{ meeting_member: { some: { staff_id: staffId } } }] : [])
        ]
      }
    }

    const meetings = await prisma.meetings.findMany({
      where: whereClause,
      include: {
        meeting_type: true,
        meeting_member: {
          include: {
            staff: true
          }
        }
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

// POST: create a meeting (with company_id)
export async function POST(req: Request) {
  try {
    const role = req.headers.get('x-user-role')
    const companyId = req.headers.get('x-company-id')

    if (role !== 'ADMIN' && role !== 'COMPANY_ADMIN' && role !== 'CONVENER') {
      return NextResponse.json({ message: 'Forbidden: Only admins and conveners can create meetings' }, { status: 403 })
    }

    const { meetingDate, meetingTypeId, description, staffIds, meetingAdminId, meetingLink } = await req.json()

    if (!meetingDate || !meetingTypeId) {
      return NextResponse.json(
        { message: 'Meeting date and meeting type are required' },
        { status: 400 }
      )
    }

    const userId = req.headers.get('x-user-id')

    const meeting = await prisma.$transaction(async (tx) => {
      const m = await tx.meetings.create({
        data: {
          meeting_date: new Date(meetingDate),
          meeting_type_id: meetingTypeId,
          meeting_description: description,
          created_by: userId ? Number(userId) : null,
          meeting_admin_id: meetingAdminId ? Number(meetingAdminId) : null,
          meeting_link: meetingLink || null,
          company_id: companyId ? Number(companyId) : null
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
    }, {
      maxWait: 5000,
      timeout: 10000
    })

    // Audit Log
    await prisma.audit_logs.create({
      data: {
        company_id: companyId ? Number(companyId) : null,
        user_id: userId ? Number(userId) : null,
        action: 'CREATE_MEETING',
        entity_type: 'meetings',
        entity_id: meeting.meeting_id,
        details: JSON.stringify({
          meeting_type_id: meetingTypeId,
          date: meetingDate,
          participant_count: staffIds?.length || 0
        })
      }
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
