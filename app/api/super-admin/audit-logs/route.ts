import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const role = req.headers.get('x-user-role')

        if (role !== 'SUPER_ADMIN') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        const logs = await prisma.audit_logs.findMany({
            orderBy: { created_at: 'desc' },
            take: 100, // Limit for now

        })

        // Enhance logs with user details manually if needed or via relation if set up
        // Currently audit_logs doesn't have a direct relation defined in schema for `user` based on previous `view_file`.
        // Let's check schema again if `user` relation exists. 
        // Based on previous `view_file` of schema:
        // model audit_logs { ... user_id Int? ... } but no @relation field visible in the snippet?
        // Wait, I saw "model audit_logs" in schema.prisma earlier.

        // Let's assume standard fetching first. 
        // Actually, looking at schema.prisma earlier:
        // model audit_logs { ... user_id Int? ... }
        // It did NOT show a relation to `users`. 
        // So we might need to manual fetch users or just return IDs.

        // Let's fetch users manually to be safe and avoid relation errors if not defined.
        const userIds = logs.map(l => l.user_id).filter(id => id !== null) as number[]
        const users = await prisma.users.findMany({
            where: { user_id: { in: userIds } },
            select: { user_id: true, name: true, email: true, role: true }
        })

        const userMap = new Map(users.map(u => [u.user_id, u]))

        const enrichedLogs = logs.map(log => ({
            ...log,
            actor: log.user_id ? userMap.get(log.user_id) : null
        }))

        return NextResponse.json({ data: enrichedLogs })

    } catch (error) {
        console.error('Fetch audit logs error:', error)
        return NextResponse.json({ message: 'Failed to fetch audit logs' }, { status: 500 })
    }
}
