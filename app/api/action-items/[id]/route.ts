
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// PUT: Update action item
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params
        const id = Number(idParam)
        const body = await req.json()
        const { isCompleted, assignedTo, description, dueDate } = body

        const data: any = { updated_at: new Date() }
        if (isCompleted !== undefined) data.is_completed = isCompleted
        if (assignedTo !== undefined) data.assigned_to = assignedTo ? Number(assignedTo) : null
        if (description !== undefined) data.description = description
        if (dueDate !== undefined) data.due_date = dueDate ? new Date(dueDate) : null

        const item = await prisma.actionItem.update({
            where: { action_item_id: id },
            data,
            include: { assignee: true }
        })

        return NextResponse.json({ message: 'Updated successfully', data: item })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Failed to update action item' }, { status: 500 })
    }
}

// DELETE: Remove action item
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params
        const id = Number(idParam)
        await prisma.actionItem.delete({
            where: { action_item_id: id }
        })
        return NextResponse.json({ message: 'Deleted successfully' })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Failed to delete action item' }, { status: 500 })
    }
}
