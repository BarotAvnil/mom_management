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
