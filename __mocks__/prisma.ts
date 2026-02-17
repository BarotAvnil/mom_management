/**
 * Type-safe Prisma Client mock.
 * Every model method becomes a jest.fn() so tests can
 * configure return values without touching the real DB.
 */

const mockModel = () => ({
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    upsert: jest.fn(),
})

const prisma = {
    users: mockModel(),
    companies: mockModel(),
    staff: mockModel(),
    meetings: mockModel(),
    meeting_type: mockModel(),
    meeting_member: mockModel(),
    registration_requests: mockModel(),
    audit_logs: mockModel(),
    actionItem: mockModel(),
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
}

export default prisma
