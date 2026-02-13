import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET: Fetch single meeting details
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await context.params
    const id = Number(meetingId)

    if (Number.isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID' }, { status: 400 })
    }

    const meeting = await prisma.meetings.findUnique({
      where: { meeting_id: id },
      include: {
        meeting_type: true,
        meeting_member: true // Include members to check attendance permission
      }
    })

    if (!meeting) {
      return NextResponse.json({ message: 'Meeting not found' }, { status: 404 })
    }

    // VISIBILITY CHECK
    const userId = req.headers.get('x-user-id')
    const role = req.headers.get('x-user-role')

    if (role !== 'ADMIN') {
      // If not System Admin, check other permissions
      const isCreator = meeting.created_by === Number(userId)
      const isMeetingAdmin = meeting.meeting_admin_id === Number(userId)

      let isInvited = false
      if (userId) {
        const user = await prisma.users.findUnique({ where: { user_id: Number(userId) } })
        if (user?.email) {
          // Check if this email matches any staff in the meeting
          // Use staff table lookup to be precise, or assume staff email = user email? 
          // Existing code uses staff table lookup. Let's do that for consistency/safety.
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

    return NextResponse.json({ data: meeting })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error fetching meeting' }, { status: 500 })
  }
}

/**
 * PUT: Update meeting details (Date, Description, Cancel)
 */
export async function PUT(
  req: Request,
  context: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await context.params
    const id = Number(meetingId)
    // Extract everything, including staffIds!
    const { meetingDate, meetingTypeId, description, isCancelled, cancellationReason, isCompleted, staffIds, meetingLink } = await req.json()

    // 1. Permission Check
    const userId = req.headers.get('x-user-id')
    const role = req.headers.get('x-user-role')

    // Fetch meeting to check ownership
    const existingMeeting = await prisma.meetings.findUnique({
      where: { meeting_id: id }
    })

    if (!existingMeeting) {
      return NextResponse.json({ message: 'Meeting not found' }, { status: 404 })
    }

    const isCreator = existingMeeting.created_by === Number(userId)
    const isMeetingAdmin = existingMeeting.meeting_admin_id === Number(userId)
    const isSysAdmin = role === 'ADMIN'

    // Only Creator, Meeting Admin, or System Admin can edit
    if (!isCreator && !isMeetingAdmin && !isSysAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // 2. Logic (Update Meeting + Manage Staff)
    // If cancelling
    let cancellationData = {}
    if (isCancelled !== undefined) {
      cancellationData = {
        is_cancelled: isCancelled,
        cancellation_reason: cancellationReason || null,
        cancellation_datetime: isCancelled ? new Date() : null
      }
    }

    // Transaction for updates ensuring consistency
    const updated = await prisma.$transaction(async (tx) => {
      // A. Update Meeting Details
      const m = await tx.meetings.update({
        where: { meeting_id: id },
        data: {
          meeting_date: meetingDate ? new Date(meetingDate) : undefined,
          meeting_type_id: meetingTypeId ? Number(meetingTypeId) : undefined,
          meeting_description: description,
          is_completed: isCompleted,
          meeting_link: meetingLink,
          ...cancellationData,
          updated_at: new Date()
        }
      })

      // B. Update Participants if `staffIds` is provided
      if (staffIds && Array.isArray(staffIds)) {
        const newStaffIds = staffIds.map((s: any) => Number(s))

        // 1. Remove members NOT in the new list
        await tx.meeting_member.deleteMany({
          where: {
            meeting_id: id,
            staff_id: { notIn: newStaffIds }
          }
        })

        // 2. Add members that don't exist yet
        // (Prisma doesn't support 'upsertMany', so we find existing first or just ignore duplicates if we rely on constraints, 
        // but `createMany` with `skipDuplicates` works nicely if supported by DB/Prisma version. 
        // Safe approach: Find existing -> Filter -> Create new)

        const existingMembers = await tx.meeting_member.findMany({
          where: { meeting_id: id },
          select: { staff_id: true }
        })
        const existingStaffIds = existingMembers.map(em => em.staff_id)

        const toAdd = newStaffIds.filter((sid: number) => !existingStaffIds.includes(sid))

        if (toAdd.length > 0) {
          await tx.meeting_member.createMany({
            data: toAdd.map((sid: number) => ({
              meeting_id: id,
              staff_id: sid,
              is_present: false // Default
            }))
          })
        }
      }
      return m
    }, {
      maxWait: 5000,
      timeout: 10000
    })

    return NextResponse.json({ message: 'Updated successfully', data: updated })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Update failed' }, { status: 500 })
  }
}

/**
 * DELETE: Delete meeting (Hard delete)
 */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await context.params
    const id = Number(meetingId)

    await prisma.meetings.delete({
      where: { meeting_id: id }
    })

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    return NextResponse.json({ message: 'Delete failed' }, { status: 500 })
  }
}
