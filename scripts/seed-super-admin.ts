import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const hash = await bcrypt.hash('admin123', 12)

    const user = await prisma.users.create({
        data: {
            name: 'Super Admin',
            email: 'superadmin@mom.com',
            password: hash,
            role: 'SUPER_ADMIN',
            company_id: null
        }
    })

    console.log('✅ SUPER_ADMIN created successfully!')
    console.log('   Email:', user.email)
    console.log('   Password: admin123')
    console.log('   Role:', user.role)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
