import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * PUT: Update a staff member
 */
export async function PUT(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params
        const staffId = Number(id)

        if (Number.isNaN(staffId)) {
            return NextResponse.json({ message: 'Invalid ID' }, { status: 400 })
        }

        const { name, email, mobileNo, remarks } = await req.json()

        const updated = await prisma.staff.update({
            where: { staff_id: staffId },
            data: {
                ...(name && { staff_name: name }),
                ...(email !== undefined && { email }),
                ...(mobileNo !== undefined && { mobile_no: mobileNo }),
                ...(remarks !== undefined && { remarks }),
            }
        })

        return NextResponse.json({ message: 'Staff updated successfully', data: updated })
    } catch (error) {
        console.error('Failed to update staff:', error)
        return NextResponse.json({ message: 'Failed to update staff member' }, { status: 500 })
    }
}

/**
 * DELETE: Remove a staff member globally
 * Only accessible by ADMIN
 */
export async function DELETE(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params
        const staffId = Number(id)

        if (Number.isNaN(staffId)) {
            return NextResponse.json({ message: 'Invalid ID' }, { status: 400 })
        }

        // Cascade delete ensures meeting_member records are removed
        await prisma.staff.delete({
            where: { staff_id: staffId }
        })

        return NextResponse.json({ message: 'Staff member deleted successfully' })
    } catch (error) {
        console.error('Failed to delete staff:', error)
        return NextResponse.json({ message: 'Failed to delete staff member' }, { status: 500 })
    }
}
