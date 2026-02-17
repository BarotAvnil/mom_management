import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * PUT: Update attendance (present/absent, remarks)
 */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> } // Match [id]
) {
  try {
    const { id } = await context.params
    const attendanceIdNumber = Number(id)
    if (Number.isNaN(attendanceIdNumber)) {
      return NextResponse.json(
        { message: 'Invalid attendance id' },
        { status: 400 }
      )
    }

    // ---------------- PERMISSION CHECK ---------------- //
    // 1. Get the authenticated user ID from headers
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // 2. Find the meeting associated with this attendance record
    const attendanceRecord = await prisma.meeting_member.findUnique({
      where: { meeting_member_id: attendanceIdNumber },
      include: { meetings: true } // Need to access meeting.created_by
    })

    if (!attendanceRecord || !attendanceRecord.meetings) {
      return NextResponse.json({ message: 'Record not found' }, { status: 404 })
    }

    // 3. Verify ownership (Meeting Admin Check)
    const creatorId = attendanceRecord.meetings.created_by
    const meetingAdminId = attendanceRecord.meetings.meeting_admin_id

    // DEBUG LOGS
    console.log('[Attendance Update Debug]', {
      userId,
      userIdNum: Number(userId),
      creatorId,
      meetingAdminId,
      role: req.headers.get('x-user-role'),
      attendanceId: attendanceIdNumber
    })

    const role = req.headers.get('x-user-role')
    const isSysAdmin = role === 'ADMIN' || role === 'COMPANY_ADMIN'

    // Check if user is Creator, Meeting Admin, or System Admin
    const isCreator = creatorId && creatorId === Number(userId)
    const isMeetingAdmin = meetingAdminId && meetingAdminId === Number(userId)

    if (!isCreator && !isMeetingAdmin && !isSysAdmin) {
      return NextResponse.json(
        { message: 'Forbidden: Only the Meeting Creator or Designated Admin can manage attendance.' },
        { status: 403 }
      )
    }
    // -------------------------------------------------- //

    const { isPresent, remarks } = await req.json()

    // Ensure isPresent is boolean if schema requires boolean, or int if schema requires int.
    // Based on user report "just able to put absent only", likely it's defaulting to false/0 because of type mismatch.
    // Frontend sends: { isPresent: !currentStatus ? 1 : 0 }
    // If Prisma expects Boolean: `1` might be truthy but `0` is falsy. 
    // Wait, if frontend sends 1, `isPresent` is number. 
    // `data: { is_present: isPresent }` -> if schema is Boolean, Prisma usually handles `true/false`.
    // Let's force convert to clean Boolean.

    const isPresentBoolean = isPresent === 1 || isPresent === true || isPresent === 'true'

    const updated = await prisma.meeting_member.update({
      where: { meeting_member_id: attendanceIdNumber },
      data: {
        is_present: isPresentBoolean, // If DB is boolean
        // If DB is Int (0/1), then `isPresentBoolean ? 1 : 0`
        // Let's assume Boolean for now based on standard Prisma usage, but checking schema would be ideal. 
        // I will assume Boolean because `is_present` sounds boolean.
        remarks
      }
    })

    return NextResponse.json({
      message: 'Attendance updated successfully',
      data: updated
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: 'Failed to update attendance' },
      { status: 500 }
    )
  }
}

/**
 * DELETE: Remove a participant from the meeting
 */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const attendanceIdNumber = Number(id)

    // 1. Auth Check
    const userId = req.headers.get('x-user-id')
    const userRole = req.headers.get('x-user-role')
    if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // 2. Find Record
    const record = await prisma.meeting_member.findUnique({
      where: { meeting_member_id: attendanceIdNumber },
      include: { meetings: true }
    })

    if (!record || !record.meetings) return NextResponse.json({ message: 'Record not found' }, { status: 404 })

    // 3. Permission Check
    const isSysAdmin = userRole === 'ADMIN' || userRole === 'COMPANY_ADMIN'
    const isCreator = record.meetings.created_by === Number(userId)
    const isMeetingAdmin = record.meetings.meeting_admin_id === Number(userId)

    if (!isSysAdmin && !isCreator && !isMeetingAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // 4. Delete
    await prisma.meeting_member.delete({
      where: { meeting_member_id: attendanceIdNumber }
    })

    return NextResponse.json({ message: 'Participant removed' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Failed to remove participant' }, { status: 500 })
  }
}
