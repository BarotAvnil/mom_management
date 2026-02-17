import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET: Fetch meeting types (company-scoped)
 */
export async function GET(req: Request) {
  try {
    const role = req.headers.get('x-user-role')
    const companyId = req.headers.get('x-company-id')

    const where: any = {}
    if (!companyId) {
      return NextResponse.json({ data: [] })
    }
    where.company_id = Number(companyId)

    const meetingTypes = await prisma.meeting_type.findMany({
      where,
      orderBy: { meeting_type_id: 'desc' }
    })

    return NextResponse.json({ data: meetingTypes })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: 'Failed to fetch meeting types' },
      { status: 500 }
    )
  }
}

/**
 * POST: Create a new meeting type (with company_id)
 */
export async function POST(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    const { meetingTypeName, remarks } = await req.json()

    if (!meetingTypeName) {
      return NextResponse.json(
        { message: 'Meeting type name is required' },
        { status: 400 }
      )
    }

    const meetingType = await prisma.meeting_type.create({
      data: {
        meeting_type_name: meetingTypeName,
        remarks,
        company_id: companyId ? Number(companyId) : null
      }
    })

    return NextResponse.json({
      message: 'Meeting type created successfully',
      data: meetingType
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: 'Failed to create meeting type' },
      { status: 500 }
    )
  }
}

/**
 * PUT: Update a meeting type
 */
export async function PUT(req: Request) {
  try {
    const { id, meetingTypeName, remarks } = await req.json()

    const updated = await prisma.meeting_type.update({
      where: { meeting_type_id: Number(id) },
      data: {
        meeting_type_name: meetingTypeName,
        remarks
      }
    })

    return NextResponse.json({ message: 'Updated', data: updated })
  } catch (error) {
    return NextResponse.json({ message: 'Update failed' }, { status: 500 })
  }
}

/**
 * DELETE: Remove a meeting type
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 })

    await prisma.meeting_type.delete({
      where: { meeting_type_id: Number(id) }
    })

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    return NextResponse.json({ message: 'Delete failed' }, { status: 500 })
  }
}
