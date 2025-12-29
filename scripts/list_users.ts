
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.users.findMany()
    console.log('--- USERS ---')
    if (users.length === 0) {
        console.log('No users found.')
    } else {
        users.forEach(u => {
            console.log(`${u.email} (${u.role})`)
        })
    }
    console.log('--- END ---')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
