import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * GET: Fetch all staff (scoped to company_id from middleware)
 */
export async function GET(req: Request) {
    try {
        const companyId = req.headers.get('x-company-id')

        const staffList = await prisma.staff.findMany({
            where: companyId ? { company_id: Number(companyId) } : undefined,
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
 * POST: Create new staff (with company_id from middleware)
 */
export async function POST(req: Request) {
    try {
        const companyId = req.headers.get('x-company-id')
        const { name, mobileNo, email, remarks } = await req.json()

        if (!name) {
            return NextResponse.json(
                { message: 'Staff name is required' },
                { status: 400 }
            )
        }

        // 1. Create Staff Entry (with company_id)
        const staff = await prisma.staff.create({
            data: {
                staff_name: name,
                mobile_no: mobileNo,
                email,
                remarks,
                company_id: companyId ? Number(companyId) : null
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
                    role: 'MEMBER',
                    company_id: companyId ? Number(companyId) : null
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
 * DELETE: Remove staff
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
        return NextResponse.json({ message: 'Cannot delete staff associated with meetings.' }, { status: 400 })
    }
}
