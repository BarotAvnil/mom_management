import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * GET: Fetch current user profile
 */
/**
 * GET: Fetch current user profile
 */
export async function GET(req: Request) {
    try {
        const userId = req.headers.get('x-user-id')

        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const user = await prisma.users.findUnique({
            where: { user_id: Number(userId) },
            select: {
                user_id: true,
                name: true,
                email: true,
                role: true,
                created_at: true
            }
        })

        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

        return NextResponse.json({ data: user })
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching profile' }, { status: 500 })
    }
}

/**
 * PUT: Update profile (Name, Password)
 */
export async function PUT(req: Request) {
    try {
        const userId = req.headers.get('x-user-id')
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const { name, password } = await req.json()

        const updateData: any = {}
        if (name) updateData.name = name
        if (password) {
            updateData.password = await bcrypt.hash(password, 10)
        }

        const updatedUser = await prisma.users.update({
            where: { user_id: Number(userId) },
            data: updateData
        })

        return NextResponse.json({ message: 'Profile updated', data: updatedUser })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Update failed' }, { status: 500 })
    }
}
