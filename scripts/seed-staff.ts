import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const staffData = [
        { staff_name: 'John Carter', mobile_no: '9876543210', email: 'john.carter@company.com', remarks: 'Senior Developer', company_id: 1 },
        { staff_name: 'Emily Watson', mobile_no: '9123456780', email: 'emily.watson@company.com', remarks: 'Project Manager', company_id: 1 },
        { staff_name: 'Michael Brown', mobile_no: '9988776655', email: 'michael.brown@company.com', remarks: 'UI/UX Designer', company_id: 1 },
        { staff_name: 'Sophia Turner', mobile_no: '9090909090', email: 'sophia.turner@company.com', remarks: 'QA Engineer', company_id: 1 },
        { staff_name: 'David Miller', mobile_no: '9012345678', email: 'david.miller@company.com', remarks: 'Business Analyst', company_id: 1 },
    ]

    const result = await prisma.staff.createMany({ data: staffData })
    console.log(`✅ Inserted ${result.count} staff records`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
