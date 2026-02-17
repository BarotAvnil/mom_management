import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function POST(
  req: Request,
  context: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await context.params
    const id = Number(meetingId)

    if (Number.isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid meeting id' },
        { status: 400 }
      )
    }

    // VISIBILITY CHECK
    const userId = req.headers.get('x-user-id')
    const role = req.headers.get('x-user-role')

    if (role !== 'ADMIN' && role !== 'COMPANY_ADMIN') {
      const meeting = await prisma.meetings.findUnique({
        where: { meeting_id: id },
        include: { meeting_member: true }
      })

      if (!meeting) return NextResponse.json({ message: 'Meeting not found' }, { status: 404 })

      // Logic: Only participants can VIEW/DOWNLOAD (if this was GET). But this is POST (Upload).
      // Upload should probably be restricted to Admins/Creators/MeetingAdmins? Or participants too?
      // Usually only Minutetaker uploads. For now, let's allow "Meeting Admin" or "Creator" or "System Admin".
      // Participants usually just view.

      const isCreator = meeting.created_by === Number(userId)
      const isMeetingAdmin = meeting.meeting_admin_id === Number(userId)

      if (!isCreator && !isMeetingAdmin) {
        return NextResponse.json({ message: 'Forbidden: Only Admins can upload MOM' }, { status: 403 })
      }
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { message: 'File is required' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), 'public/uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const fileName = `mom_${id}_${Date.now()}_${file.name}`
    const filePath = path.join(uploadDir, fileName)

    fs.writeFileSync(filePath, buffer)

    const dbPath = `/uploads/${fileName}`

    await prisma.meetings.update({
      where: { meeting_id: id },
      data: { document_path: dbPath }
    })

    return NextResponse.json({
      message: 'MOM uploaded successfully',
      filePath: dbPath
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: 'Failed to upload MOM' },
      { status: 500 }
    )
  }
}
