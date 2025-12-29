import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const meetings = await prisma.meetings.findMany({
      select: {
        meeting_id: true,
        meeting_date: true,
        meeting_description: true,
        is_cancelled: true,
        document_path: true
      },
      orderBy: { meeting_date: 'desc' }
    })

    return NextResponse.json(meetings)
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch meeting report' },
      { status: 500 }
    )
  }
}
