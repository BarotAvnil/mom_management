import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * POST: Public endpoint — submit company registration request
 */
export async function POST(req: Request) {
    try {
        const { companyName, assistantName, email, password } = await req.json()

        // Validate required fields
        if (!companyName || !assistantName || !email || !password) {
            return NextResponse.json(
                { message: 'All fields are required: companyName, assistantName, email, password' },
                { status: 400 }
            )
        }

        // Check for duplicate email
        const existingRequest = await prisma.registration_requests.findUnique({
            where: { assistant_email: email }
        })
        if (existingRequest) {
            return NextResponse.json(
                { message: 'A registration request with this email already exists' },
                { status: 409 }
            )
        }

        // Check if email already registered as a user
        const existingUser = await prisma.users.findFirst({
            where: { email }
        })
        if (existingUser) {
            return NextResponse.json(
                { message: 'An account with this email already exists' },
                { status: 409 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create registration request
        const request = await prisma.registration_requests.create({
            data: {
                company_name: companyName.trim(),
                assistant_name: assistantName.trim(),
                assistant_email: email.trim().toLowerCase(),
                assistant_password: hashedPassword,
                status: 'PENDING'
            }
        })

        return NextResponse.json(
            { message: 'Registration request submitted successfully. You will be notified once approved.', data: { request_id: request.request_id } },
            { status: 201 }
        )
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { message: 'Failed to submit registration request' },
            { status: 500 }
        )
    }
}
