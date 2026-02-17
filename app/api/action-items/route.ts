
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET: Fetch action items (company-scoped via meeting)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const meetingId = searchParams.get('meetingId')
        const staffId = searchParams.get('staffId')
        const companyId = req.headers.get('x-company-id')
        const role = req.headers.get('x-user-role')

        const where: any = {}

        if (meetingId) where.meeting_id = Number(meetingId)
        if (staffId) where.assigned_to = Number(staffId)

        // Company isolation
        if (companyId) {
            where.company_id = Number(companyId)
        }

        const items = await prisma.actionItem.findMany({
            where,
            include: {
                assignee: {
                    select: { staff_name: true, staff_id: true, email: true }
                },
                meeting: {
                    select: { meeting_description: true, meeting_date: true }
                }
            },
            orderBy: [{ is_completed: 'asc' }, { due_date: 'asc' }]
        })

        return NextResponse.json({ data: items })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Failed to fetch action items' }, { status: 500 })
    }
}

// POST: Create action item (with company_id)
export async function POST(req: Request) {
    try {
        const companyId = req.headers.get('x-company-id')
        const body = await req.json()
        const { description, meetingId, assignedTo, dueDate } = body

        if (!description || !meetingId) {
            return NextResponse.json({ message: 'Description and Meeting ID are required' }, { status: 400 })
        }

        const item = await prisma.actionItem.create({
            data: {
                description,
                meeting_id: Number(meetingId),
                assigned_to: assignedTo ? Number(assignedTo) : null,
                due_date: dueDate ? new Date(dueDate) : null,
                company_id: companyId ? Number(companyId) : null
            },
            include: {
                assignee: true
            }
        })

        return NextResponse.json({ message: 'Action item created', data: item }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Failed to create action item' }, { status: 500 })
    }
}
