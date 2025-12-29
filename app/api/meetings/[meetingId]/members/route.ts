import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * POST: Add staff to meeting (Create meeting_member)
 */
export async function POST(
    req: Request,
    context: { params: Promise<{ meetingId: string }> }
) {
    try {
        const { meetingId } = await context.params
        const id = Number(meetingId)
        const { staffId } = await req.json() // Expect staffId only, defaults to not present

        if (!staffId) return NextResponse.json({ message: 'Staff ID required' }, { status: 400 })

        const member = await prisma.meeting_member.create({
            data: {
                meeting_id: id,
                staff_id: Number(staffId),
                is_present: false // Default
            }
        })

        return NextResponse.json({ message: 'Member added', data: member })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Failed to add member (User might be already added)' }, { status: 500 })
    }
}

/**
 * DELETE: Remove staff from meeting
 */
export async function DELETE(
    req: Request,
    context: { params: Promise<{ meetingId: string }> }
) {
    try {
        const { searchParams } = new URL(req.url)
        const memberId = searchParams.get('memberId')

        if (!memberId) return NextResponse.json({ message: 'Member ID required' }, { status: 400 })

        await prisma.meeting_member.delete({
            where: { meeting_member_id: Number(memberId) }
        })

        return NextResponse.json({ message: 'Member removed' })
    } catch (error) {
        return NextResponse.json({ message: 'Failed to remove' }, { status: 500 })
    }
}
