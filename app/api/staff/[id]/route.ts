import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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

        // 1. Auth Check
        const role = req.headers.get('x-user-role')
        if (role !== 'ADMIN') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        // 2. Validate ID
        if (Number.isNaN(staffId)) {
            return NextResponse.json({ message: 'Invalid ID' }, { status: 400 })
        }

        // 3. Delete Staff
        // Cascade delete ensures meeting_member records are removed
        await prisma.staff.delete({
            where: { staff_id: staffId }
        })

        return NextResponse.json({ message: 'Staff member deleted successfully' })
    } catch (error) {
        console.error('Failed to delete staff:', error)
        // Check for specific Prisma errors (like record not found)
        return NextResponse.json({ message: 'Failed to delete staff member' }, { status: 500 })
    }
}
