import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAuditLogs() {
    console.log('Checking recent audit logs...');
    try {
        const logs = await prisma.audit_logs.findMany({
            orderBy: { created_at: 'desc' },
            take: 5
        });

        console.log('Recent logs:', JSON.stringify(logs, null, 2));

    } catch (e) {
        console.error('Failed to fetch logs:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkAuditLogs();
