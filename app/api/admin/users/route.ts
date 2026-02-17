import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET: Fetch all users (scoped to company_id)
export async function GET(req: Request) {
    try {
        const role = req.headers.get('x-user-role')
        const companyId = req.headers.get('x-company-id')

        if (!['ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'].includes(role || '')) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        // SUPER_ADMIN: can view a specific company's users via ?companyId=X (from super-admin panel)
        // OR search globally via ?search=XYZ
        // COMPANY_ADMIN: sees only their own company's users
        const url = new URL(req.url)
        const queryCompanyId = url.searchParams.get('companyId')
        const searchQuery = url.searchParams.get('search')

        let whereClause: any = {}

        if (role === 'SUPER_ADMIN') {
            if (searchQuery) {
                // Global search - Filter to Admins only
                whereClause = {
                    AND: [
                        {
                            OR: [
                                { name: { contains: searchQuery, mode: 'insensitive' } },
                                { email: { contains: searchQuery, mode: 'insensitive' } }
                            ]
                        },
                        {
                            role: { in: ['SUPER_ADMIN', 'COMPANY_ADMIN'] }
                        }
                    ]
                }
            } else if (queryCompanyId) {
                // Company specific
                whereClause = { company_id: Number(queryCompanyId) }
            } else {
                // Default list - Filter to Admins only
                whereClause = {
                    role: { in: ['SUPER_ADMIN', 'COMPANY_ADMIN'] }
                }
            }
        } else {
            whereClause = { company_id: companyId ? Number(companyId) : undefined }
        }

        const users = await prisma.users.findMany({
            where: whereClause,
            select: {
                user_id: true,
                name: true,
                email: true,
                role: true,
                created_at: true,
                company: {
                    select: {
                        company_name: true
                    }
                }
            },
            orderBy: { created_at: 'desc' },
            take: 50 // Limit results
        })

        return NextResponse.json({ data: users })
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching users' }, { status: 500 })
    }
}

// POST: Create a new user (admin driven)
export async function POST(req: Request) {
    try {
        const role = req.headers.get('x-user-role')
        const adminCompanyId = req.headers.get('x-company-id')
        const adminUserId = req.headers.get('x-user-id')

        if (!['ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'].includes(role || '')) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        const body = await req.json()
        const { name, email, password, role: newRole, companyId } = body

        if (!name || !email || !password || !newRole) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
        }

        // Validate target role details
        const validRoles = ['COMPANY_ADMIN', 'MEMBER', 'ADMIN', 'CONVENER', 'USER', 'STAFF', 'SUPER_ADMIN']
        if (!validRoles.includes(newRole)) {
            return NextResponse.json({ message: 'Invalid role' }, { status: 400 })
        }

        // Security Checks
        if (newRole === 'SUPER_ADMIN') {
            if (role !== 'SUPER_ADMIN') {
                return NextResponse.json({ message: 'Only Super Admins can create Super Admins' }, { status: 403 })
            }
        }

        // If COMPANY_ADMIN, can only create for their company
        if (role === 'COMPANY_ADMIN') {
            if (Number(companyId) !== Number(adminCompanyId)) {
                return NextResponse.json({ message: 'Cannot create users for other companies' }, { status: 403 })
            }
            if (newRole === 'SUPER_ADMIN') {
                return NextResponse.json({ message: 'Company Admins cannot create Super Admins' }, { status: 403 })
            }
        }

        // Check if user already exists
        const existingUser = await prisma.users.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await prisma.users.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: newRole,
                company_id: newRole === 'SUPER_ADMIN' ? null : (companyId ? Number(companyId) : null)
            }
        })

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser

        // Audit Log
        await prisma.audit_logs.create({
            data: {
                user_id: Number(adminUserId),
                action: 'CREATE_USER',
                entity_type: 'users',
                entity_id: newUser.user_id,
                company_id: newUser.company_id,
                details: JSON.stringify({
                    role: newRole,
                    name: name,
                    email: email
                })
            }
        })

        return NextResponse.json({ message: 'User created successfully', data: userWithoutPassword }, { status: 201 })

    } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json({ message: 'Error creating user' }, { status: 500 })
    }
}

// PUT: Update user role
// PUT: Update user role
export async function PUT(req: Request) {
    try {
        const role = req.headers.get('x-user-role')
        const adminUserId = req.headers.get('x-user-id')
        // Only existing admins can update roles
        if (!['ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'].includes(role || '')) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        const { userId, newRole } = await req.json()

        if (!userId || !newRole) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
        }

        // Validate target role
        const validRoles = ['COMPANY_ADMIN', 'MEMBER', 'ADMIN', 'CONVENER', 'USER', 'STAFF', 'SUPER_ADMIN']
        if (!validRoles.includes(newRole)) {
            return NextResponse.json({ message: 'Invalid role' }, { status: 400 })
        }

        // Security Check: Only SUPER_ADMIN can promote to SUPER_ADMIN
        if (newRole === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
            return NextResponse.json({ message: 'Only Super Admins can promote users to Super Admin' }, { status: 403 })
        }

        const updatedUser = await prisma.users.update({
            where: { user_id: Number(userId) },
            data: { role: newRole }
        })

        // Audit Log
        await prisma.audit_logs.create({
            data: {
                user_id: Number(adminUserId),
                action: 'UPDATE_USER_ROLE',
                entity_type: 'users',
                entity_id: Number(userId),
                details: JSON.stringify({
                    old_role: 'UNKNOWN', // Ideally fetch old role first, but minimal query is faster
                    new_role: newRole
                })
            }
        })

        return NextResponse.json({ message: 'Role updated successfully', data: updatedUser })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error updating user' }, { status: 500 })
    }
}
