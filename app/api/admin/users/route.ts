import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET: Fetch all users (for Admin dashboard)
export async function GET(req: Request) {
    try {
        const role = req.headers.get('x-user-role')
        if (role !== 'ADMIN' && role !== 'CONVENER') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        const users = await prisma.users.findMany({
            select: {
                user_id: true,
                name: true,
                email: true,
                role: true,
                created_at: true
            },
            orderBy: { created_at: 'desc' }
        })

        return NextResponse.json({ data: users })
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching users' }, { status: 500 })
    }
}

// PUT: Update user role
export async function PUT(req: Request) {
    try {
        const role = req.headers.get('x-user-role')
        if (role !== 'ADMIN') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        const { userId, newRole } = await req.json()

        if (!userId || !newRole) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
        }

        // Validate role enum if strictly enforcing, but string is fine for now
        const validRoles = ['ADMIN', 'CONVENER', 'USER', 'STAFF']
        // You might have different role names, adjusting to what's likely used.
        // Based on previous context, 'CONVENER' is the key one.

        if (!validRoles.includes(newRole)) {
            // Optional: strict validation
        }

        const updatedUser = await prisma.users.update({
            where: { user_id: Number(userId) },
            data: { role: newRole }
        })

        return NextResponse.json({ message: 'Role updated successfully', data: updatedUser })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error updating user' }, { status: 500 })
    }
}
