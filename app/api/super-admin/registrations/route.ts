import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET: Fetch all registration requests (Super Admin only — enforced by middleware)
 * Query params: ?status=PENDING|APPROVED|REJECTED
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')

        const requests = await prisma.registration_requests.findMany({
            where: status ? { status } : undefined,
            orderBy: { created_at: 'desc' },
            include: {
                reviewer: {
                    select: { name: true, email: true }
                }
            }
        })

        return NextResponse.json({ data: requests })
    } catch (error) {
        console.error('Fetch registrations error:', error)
        return NextResponse.json({ message: 'Failed to fetch registrations' }, { status: 500 })
    }
}

/**
 * PUT: Approve or Reject a registration request
 * Body: { requestId, action: 'APPROVE' | 'REJECT', rejectionReason?: string }
 */
export async function PUT(req: Request) {
    try {
        const userId = Number(req.headers.get('x-user-id'))
        const { requestId, action, rejectionReason } = await req.json()

        if (!requestId || !['APPROVE', 'REJECT'].includes(action)) {
            return NextResponse.json(
                { message: 'requestId and action (APPROVE|REJECT) are required' },
                { status: 400 }
            )
        }

        // Fetch the request
        const registration = await prisma.registration_requests.findUnique({
            where: { request_id: Number(requestId) }
        })

        if (!registration) {
            return NextResponse.json({ message: 'Registration request not found' }, { status: 404 })
        }

        if (registration.status !== 'PENDING') {
            return NextResponse.json(
                { message: `Request already ${registration.status.toLowerCase()}` },
                { status: 400 }
            )
        }

        // ─── REJECT ─────────────────────────────────────────
        if (action === 'REJECT') {
            const updated = await prisma.registration_requests.update({
                where: { request_id: Number(requestId) },
                data: {
                    status: 'REJECTED',
                    rejection_reason: rejectionReason || null,
                    reviewed_by: userId,
                    reviewed_at: new Date()
                }
            })

            // Audit log
            await prisma.audit_logs.create({
                data: {
                    user_id: userId,
                    action: 'REJECT_REGISTRATION',
                    entity_type: 'registration_requests',
                    entity_id: Number(requestId),
                    details: JSON.stringify({ reason: rejectionReason })
                }
            })

            return NextResponse.json({ message: 'Registration rejected', data: updated })
        }

        // ─── APPROVE (Transactional) ────────────────────────
        const result = await prisma.$transaction(async (tx) => {
            // 1. Validate company name is unique
            const existingCompany = await tx.companies.findUnique({
                where: { company_name: registration.company_name }
            })
            if (existingCompany) {
                throw new Error(`Company "${registration.company_name}" already exists`)
            }

            // 2. Validate email not already a user
            const existingUser = await tx.users.findFirst({
                where: { email: registration.assistant_email }
            })
            if (existingUser) {
                throw new Error(`User with email "${registration.assistant_email}" already exists`)
            }

            // 3. Create company
            const company = await tx.companies.create({
                data: {
                    company_name: registration.company_name,
                    status: 'ACTIVE'
                }
            })

            // 4. Create COMPANY_ADMIN user
            const user = await tx.users.create({
                data: {
                    name: registration.assistant_name,
                    email: registration.assistant_email,
                    password: registration.assistant_password, // Already hashed at registration
                    role: 'COMPANY_ADMIN',
                    company_id: company.company_id
                }
            })

            // 5. Update request status
            const updated = await tx.registration_requests.update({
                where: { request_id: Number(requestId) },
                data: {
                    status: 'APPROVED',
                    reviewed_by: userId,
                    reviewed_at: new Date()
                }
            })

            // 6. Audit log
            await tx.audit_logs.create({
                data: {
                    company_id: company.company_id,
                    user_id: userId,
                    action: 'APPROVE_REGISTRATION',
                    entity_type: 'registration_requests',
                    entity_id: Number(requestId),
                    details: JSON.stringify({
                        company_id: company.company_id,
                        company_name: company.company_name,
                        admin_user_id: user.user_id
                    })
                }
            })

            return { request: updated, company, adminUser: user }
        })

        return NextResponse.json({
            message: `Registration approved. Company "${result.company.company_name}" created.`,
            data: result
        })
    } catch (error: any) {
        console.error('Registration action error:', error)
        return NextResponse.json(
            { message: error.message || 'Failed to process registration' },
            { status: 500 }
        )
    }
}
