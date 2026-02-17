import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET: Fetch all companies with user/meeting counts (Super Admin only)
 */
export async function GET() {
    try {
        const companies = await prisma.companies.findMany({
            where: { deleted_at: null }, // Exclude soft-deleted
            orderBy: { created_at: 'desc' },
            include: {
                _count: {
                    select: {
                        users: true,
                        staff: true,
                        meetings: true,
                    }
                }
            }
        })

        return NextResponse.json({ data: companies })
    } catch (error) {
        console.error('Fetch companies error:', error)
        return NextResponse.json({ message: 'Failed to fetch companies' }, { status: 500 })
    }
}

/**
 * PUT: Update company status (suspend/activate)
 * Body: { companyId, status: 'ACTIVE' | 'SUSPENDED' }
 */
export async function PUT(req: Request) {
    try {
        const userId = Number(req.headers.get('x-user-id'))
        const { companyId, status } = await req.json()

        if (!companyId || !['ACTIVE', 'SUSPENDED'].includes(status)) {
            return NextResponse.json(
                { message: 'companyId and status (ACTIVE|SUSPENDED) required' },
                { status: 400 }
            )
        }

        const updated = await prisma.companies.update({
            where: { company_id: Number(companyId) },
            data: { status, updated_at: new Date() }
        })

        // Audit log
        await prisma.audit_logs.create({
            data: {
                company_id: Number(companyId),
                user_id: userId,
                action: status === 'SUSPENDED' ? 'SUSPEND_COMPANY' : 'ACTIVATE_COMPANY',
                entity_type: 'companies',
                entity_id: Number(companyId),
                details: JSON.stringify({ new_status: status })
            }
        })

        return NextResponse.json({ message: `Company ${status.toLowerCase()}`, data: updated })
    } catch (error) {
        console.error('Update company error:', error)
        return NextResponse.json({ message: 'Failed to update company' }, { status: 500 })
    }
}
