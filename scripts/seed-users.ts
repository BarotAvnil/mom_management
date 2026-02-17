import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = await bcrypt.hash('password123', 10)

    const users = [
        { name: 'John Carter', email: 'john.carter@company.com', password, role: 'MEMBER', company_id: 1 },
        { name: 'Emily Watson', email: 'emily.watson@company.com', password, role: 'MEMBER', company_id: 1 },
        { name: 'Michael Brown', email: 'michael.brown@company.com', password, role: 'MEMBER', company_id: 1 },
        { name: 'Sophia Turner', email: 'sophia.turner@company.com', password, role: 'MEMBER', company_id: 1 },
        { name: 'David Miller', email: 'david.miller@company.com', password, role: 'MEMBER', company_id: 1 },
    ]

    const result = await prisma.users.createMany({ data: users })
    console.log(`✅ Created ${result.count} user login accounts`)
    console.log('   Password for all: password123')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
