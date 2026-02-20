import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await prisma.users.findFirst({
      where: { email },
      include: { company: true }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Block login if company is suspended or soft-deleted (SUPER_ADMIN bypasses)
    if (user.role !== 'SUPER_ADMIN' && user.company) {
      if (user.company.status !== 'ACTIVE' || user.company.deleted_at) {
        return NextResponse.json(
          { message: 'Your company account is suspended. Contact support.' },
          { status: 403 }
        )
      }
    }

    // Check for MFA
    if (user.is_mfa_enabled) {
      const tempToken = jwt.sign(
        { id: user.user_id, temp: true },
        process.env.JWT_SECRET as string,
        { expiresIn: '5m' } // Short expiry for MFA entry
      )

      return NextResponse.json({
        message: 'MFA required',
        mfaRequired: true,
        tempToken
      })
    }

    // JWT includes company_id (null for SUPER_ADMIN)
    const token = jwt.sign(
      {
        id: user.user_id,
        role: user.role,
        company_id: user.company_id // null for SUPER_ADMIN
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    )

    const response = NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        company_name: user.company?.company_name || null
      }
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400,
      path: '/'
    })

    // Audit log for login
    await prisma.audit_logs.create({
      data: {
        user_id: user.user_id,
        action: 'USER_LOGIN',
        entity_type: 'users',
        entity_id: user.user_id,
        company_id: user.company_id,
        details: JSON.stringify({ role: user.role, ip: req.headers.get('x-forwarded-for') || 'unknown' })
      }
    })

    return response
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
