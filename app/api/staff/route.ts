import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * GET: Fetch all staff
 */
export async function GET() {
    try {
        const staffList = await prisma.staff.findMany({
            orderBy: { staff_id: 'desc' }
        })

        return NextResponse.json({ data: staffList })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { message: 'Failed to fetch staff list' },
            { status: 500 }
        )
    }
}

/**
 * POST: Create new staff
 */
export async function POST(req: Request) {
    try {
        const { name, mobileNo, email, remarks } = await req.json()

        if (!name) {
            return NextResponse.json(
                { message: 'Staff name is required' },
                { status: 400 }
            )
        }

        // 1. Create Staff Entry
        const staff = await prisma.staff.create({
            data: {
                staff_name: name,
                mobile_no: mobileNo,
                email,
                remarks
            }
        })

        // 2. Create User Login (if email provided)
        if (email) {
            const hashedPassword = await bcrypt.hash('password123', 10)
            await prisma.users.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: 'STAFF' // Default role
                }
            }).catch(e => console.error('Failed to create user login:', e))
        }

        return NextResponse.json({
            message: 'Staff created successfully',
            data: staff
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { message: 'Failed to create staff' },
            { status: 500 }
        )
    }
}

/**
 * DELETE: Remove staff (Caution: Cascades if not careful, though schema says Cascade on Member)
 */
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 })

        await prisma.staff.delete({
            where: { staff_id: Number(id) }
        })

        return NextResponse.json({ message: 'Staff deleted successfully' })
    } catch (error) {
        console.error(error)
        // Likely foreign key constraint if they are in a meeting
        return NextResponse.json({ message: 'Cannot delete staff associated with meetings.' }, { status: 400 })
    }
}
