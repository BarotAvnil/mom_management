
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Get args: email role
    const args = process.argv.slice(2)
    if (args.length < 2) {
        console.log('Usage: npx tsx scripts/change_role.ts <email> <ADMIN|STAFF>')
        process.exit(1)
    }

    const email = args[0]
    const role = args[1].toUpperCase()

    if (!['ADMIN', 'STAFF'].includes(role)) {
        console.log('Invalid role. Use ADMIN or STAFF.')
        process.exit(1)
    }

    const user = await prisma.users.update({
        where: { email },
        data: { role }
    })

    console.log(`Updated user ${user.email} to role ${user.role}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
