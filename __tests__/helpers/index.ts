/**
 * Test Helpers — JWT generation, request builders, data factories.
 * Centralizes all shared test utilities for consistency.
 */
import jwt from 'jsonwebtoken'

// ─── Constants ───────────────────────────────────────────

export const TEST_JWT_SECRET = 'test-jwt-secret-key-for-testing'

// Ensure env is set before route handlers read it
process.env.JWT_SECRET = TEST_JWT_SECRET
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

// ─── Token Payloads ──────────────────────────────────────

export interface TokenPayload {
    id: number
    role: string
    company_id: number | null
}

export const SUPER_ADMIN_PAYLOAD: TokenPayload = {
    id: 1,
    role: 'SUPER_ADMIN',
    company_id: null,
}

export const COMPANY_ADMIN_PAYLOAD: TokenPayload = {
    id: 10,
    role: 'COMPANY_ADMIN',
    company_id: 1,
}

export const MEMBER_PAYLOAD: TokenPayload = {
    id: 20,
    role: 'MEMBER',
    company_id: 1,
}

export const COMPANY2_ADMIN_PAYLOAD: TokenPayload = {
    id: 30,
    role: 'COMPANY_ADMIN',
    company_id: 2,
}

export const COMPANY2_MEMBER_PAYLOAD: TokenPayload = {
    id: 40,
    role: 'MEMBER',
    company_id: 2,
}

// ─── JWT Generator ───────────────────────────────────────

export function generateToken(payload: TokenPayload, expiresIn = '1d'): string {
    return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn })
}

export function generateExpiredToken(payload: TokenPayload): string {
    return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '0s' })
}

export function generateTokenWithWrongSecret(payload: TokenPayload): string {
    return jwt.sign(payload, 'wrong-secret-key', { expiresIn: '1d' })
}

// ─── Request Builder ─────────────────────────────────────

interface RequestOptions {
    method?: string
    body?: Record<string, unknown> | null
    headers?: Record<string, string>
    url?: string
    searchParams?: Record<string, string>
}

/**
 * Build a Request object mimicking Next.js middleware-processed requests.
 * x-user-id, x-user-role, x-company-id headers are auto-set from the payload.
 */
export function createRequest(options: RequestOptions = {}): Request {
    const {
        method = 'GET',
        body = null,
        headers = {},
        url = 'http://localhost:3000/api/test',
        searchParams = {},
    } = options

    const urlObj = new URL(url)
    Object.entries(searchParams).forEach(([k, v]) => urlObj.searchParams.set(k, v))

    const init: RequestInit = {
        method,
        headers: new Headers(headers),
    }

    if (body && method !== 'GET') {
        init.body = JSON.stringify(body)
            ; (init.headers as Headers).set('content-type', 'application/json')
    }

    return new Request(urlObj.toString(), init)
}

/**
 * Build an authenticated request with tenant headers pre-set.
 */
export function createAuthRequest(
    payload: TokenPayload,
    options: Omit<RequestOptions, 'headers'> & { extraHeaders?: Record<string, string> } = {}
): Request {
    const { extraHeaders = {}, ...rest } = options
    return createRequest({
        ...rest,
        headers: {
            'x-user-id': String(payload.id),
            'x-user-role': payload.role,
            'x-company-id': payload.company_id !== null ? String(payload.company_id) : '',
            ...extraHeaders,
        },
    })
}

// ─── Data Factories ──────────────────────────────────────

export function makeUser(overrides: Record<string, unknown> = {}) {
    return {
        user_id: 10,
        name: 'Test User',
        email: 'test@company.com',
        password: '$2a$10$hashedpassword',
        role: 'COMPANY_ADMIN',
        company_id: 1,
        created_at: new Date('2025-01-01'),
        reset_token: null,
        reset_token_expiry: null,
        company: {
            company_id: 1,
            company_name: 'Test Corp',
            domain: 'testcorp.com',
            status: 'ACTIVE',
            deleted_at: null,
        },
        ...overrides,
    }
}

export function makeStaff(overrides: Record<string, unknown> = {}) {
    return {
        staff_id: 1,
        staff_name: 'John Staff',
        mobile_no: '9876543210',
        email: 'john@company.com',
        remarks: null,
        company_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
        ...overrides,
    }
}

export function makeMeeting(overrides: Record<string, unknown> = {}) {
    return {
        meeting_id: 1,
        meeting_date: new Date('2025-06-01T10:00:00Z'),
        meeting_type_id: 1,
        meeting_description: 'Test Meeting',
        document_path: null,
        meeting_link: null,
        is_cancelled: false,
        is_completed: false,
        cancellation_reason: null,
        cancellation_datetime: null,
        company_id: 1,
        created_by: 10,
        meeting_admin_id: 10,
        created_at: new Date(),
        updated_at: new Date(),
        meeting_type: { meeting_type_id: 1, meeting_type_name: 'Board Meeting' },
        meeting_member: [],
        ...overrides,
    }
}

export function makeMeetingType(overrides: Record<string, unknown> = {}) {
    return {
        meeting_type_id: 1,
        meeting_type_name: 'Board Meeting',
        remarks: null,
        company_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
        ...overrides,
    }
}

export function makeActionItem(overrides: Record<string, unknown> = {}) {
    return {
        action_item_id: 1,
        description: 'Complete docs',
        is_completed: false,
        due_date: new Date('2025-07-01'),
        company_id: 1,
        meeting_id: 1,
        assigned_to: 1,
        created_at: new Date(),
        updated_at: new Date(),
        assignee: { staff_id: 1, staff_name: 'John Staff', email: 'john@company.com' },
        meeting: { meeting_description: 'Test Meeting', meeting_date: new Date() },
        ...overrides,
    }
}

export function makeRegistrationRequest(overrides: Record<string, unknown> = {}) {
    return {
        request_id: 1,
        company_name: 'New Corp',
        assistant_name: 'Jane Admin',
        assistant_email: 'jane@newcorp.com',
        assistant_password: '$2a$12$hashedpassword',
        status: 'PENDING',
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: new Date(),
        ...overrides,
    }
}

export function makeCompany(overrides: Record<string, unknown> = {}) {
    return {
        company_id: 1,
        company_name: 'Test Corp',
        domain: 'testcorp.com',
        status: 'ACTIVE',
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        _count: { users: 5, staff: 10, meetings: 20 },
        ...overrides,
    }
}

// ─── Response Helpers ────────────────────────────────────

export async function parseResponse(response: Response) {
    const json = await response.json()
    return { status: response.status, body: json }
}
