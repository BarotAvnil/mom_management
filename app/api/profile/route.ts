import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * GET: Fetch current user profile with stats and activity
 */
export async function GET(req: Request) {
    try {
        const userId = req.headers.get('x-user-id')
        const companyId = req.headers.get('x-company-id')

        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const user = await prisma.users.findUnique({
            where: { user_id: Number(userId) },
            select: {
                user_id: true,
                name: true,
                email: true,
                role: true,
                created_at: true,
                company: {
                    select: {
                        company_id: true,
                        company_name: true,
                        domain: true,
                        status: true
                    }
                }
            }
        })

        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

        // Fetch activity stats for tenant users
        let stats = null
        let recentMeetings: any[] = []
        let actionItems: any[] = []

        if (companyId) {
            // Find linked staff record
            const staffRecord = await prisma.staff.findFirst({
                where: { email: user.email, company_id: Number(companyId) }
            })

            const staffId = staffRecord?.staff_id

            // Meetings created by this user
            const meetingsCreated = await prisma.meetings.count({
                where: { created_by: Number(userId), company_id: Number(companyId) }
            })

            // Meetings attended
            const meetingsAttended = staffId
                ? await prisma.meeting_member.count({
                    where: {
                        staff_id: staffId,
                        is_present: true
                    }
                })
                : 0

            // Total meetings invited to
            const meetingsInvited = staffId
                ? await prisma.meeting_member.count({
                    where: { staff_id: staffId }
                })
                : 0

            // Action items assigned
            const pendingActions = staffId
                ? await prisma.actionItem.count({
                    where: { assigned_to: staffId, is_completed: false, company_id: Number(companyId) }
                })
                : 0

            const completedActions = staffId
                ? await prisma.actionItem.count({
                    where: { assigned_to: staffId, is_completed: true, company_id: Number(companyId) }
                })
                : 0

            stats = {
                meetingsCreated,
                meetingsAttended,
                meetingsInvited,
                pendingActions,
                completedActions,
                attendanceRate: meetingsInvited > 0
                    ? Math.round((meetingsAttended / meetingsInvited) * 100)
                    : 0
            }

            // Recent meetings (last 5)
            const recentWhere: any = { company_id: Number(companyId) }
            if (staffId) {
                recentWhere.OR = [
                    { created_by: Number(userId) },
                    { meeting_member: { some: { staff_id: staffId } } }
                ]
            } else {
                recentWhere.created_by = Number(userId)
            }

            recentMeetings = await prisma.meetings.findMany({
                where: recentWhere,
                orderBy: { meeting_date: 'desc' },
                take: 5,
                select: {
                    meeting_id: true,
                    meeting_description: true,
                    meeting_date: true,
                    is_cancelled: true,
                    is_completed: true,
                    meeting_type: { select: { meeting_type_name: true } }
                }
            })

            // Pending action items
            if (staffId) {
                actionItems = await prisma.actionItem.findMany({
                    where: {
                        assigned_to: staffId,
                        is_completed: false,
                        company_id: Number(companyId)
                    },
                    orderBy: { due_date: 'asc' },
                    take: 5,
                    select: {
                        action_item_id: true,
                        description: true,
                        due_date: true,
                        meeting: { select: { meeting_description: true } }
                    }
                })
            }
        }

        return NextResponse.json({
            data: user,
            stats,
            recentMeetings,
            actionItems
        })
    } catch (error) {
        console.error(error)
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
