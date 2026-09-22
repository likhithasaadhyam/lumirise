import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

/**
 * Lumirise Production Migration Helper
 * Imports the exported JSON development data dump into a target PostgreSQL database.
 * Run with: npx tsx src/scripts/import-to-postgres.ts
 *
 * Circular FK fix: User.employeeId <-> Employee.userId
 *   Step 1: Import users WITHOUT employeeId
 *   Step 2: Import employees (with userId)
 *   Step 3: Patch users to restore employeeId
 */

const prisma = new PrismaClient();

async function importAll() {
  const dumpPath = path.join(__dirname, '../../prisma/dev-data-dump.json');
  if (!fs.existsSync(dumpPath)) {
    console.error(`Dump file not found at ${dumpPath}. Please run export-data.ts first.`);
    process.exit(1);
  }

  const raw = fs.readFileSync(dumpPath, 'utf8');
  const data: Record<string, any[]> = JSON.parse(raw);

  console.log('--- Importing Lumirise Development Data into PostgreSQL ---');

  // Insert in strict foreign-key order
  const order: string[] = [
    'organization',
    'role',
    'permission',
    'department',
    'shift',
    'leaveType',
    'user',
    'employee',
    'attendance',
    'leaveRequest',
    'jobOpening',
    'candidate',
    'onboardingTask',
    'payrollPeriod',
    'payrollSlip',
    'performanceReview',
    'warehouse',
    'supplier',
    'rawMaterial',
    'product',
    'batch',
    'stockLedgerEntry',
    'stockTransfer',
    'productionPlan',
    'productionOrder',
    'materialIssue',
    'qualityInspection',
    'finishedGood',
    'dispatchOrder',
    'customer',
    'lead',
    'quotation',
    'salesOrder',
    'invoice',
    'payment',
    'notification',
    'auditLog'
  ];

  for (const model of order) {
    const records = data[model];
    if (!records || records.length === 0) continue;

    console.log(`Importing ${records.length} records into model: ${model}...`);
    for (const record of records) {
      try {
        // Date strings need to be parsed to Date objects
        const parsedRecord: Record<string, any> = { ...record };
        for (const [key, val] of Object.entries(parsedRecord)) {
          if (
            typeof val === 'string' &&
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)
          ) {
            parsedRecord[key] = new Date(val);
          }
        }

        // Step 1: Strip employeeId from user to break circular FK with Employee
        if (model === 'user') {
          delete parsedRecord.employeeId;
        }

        await (prisma as any)[model].upsert({
          where: { id: record.id },
          create: parsedRecord,
          update: parsedRecord
        });
      } catch (err: any) {
        console.warn(`[Skip/Warn] Error upserting into ${model} (id: ${record.id}):`, err.message);
      }
    }
  }

  // Step 3: Patch users to restore employeeId now that employees are inserted
  const users: any[] = data['user'] ?? [];
  const usersWithEmployee = users.filter((u: any) => u.employeeId);
  if (usersWithEmployee.length > 0) {
    console.log(`\nPatching ${usersWithEmployee.length} user(s) to restore employeeId...`);
    for (const u of usersWithEmployee) {
      try {
        await prisma.user.update({
          where: { id: u.id },
          data: { employeeId: u.employeeId }
        });
        console.log(`  ✔ ${u.email} -> employeeId: ${u.employeeId}`);
      } catch (err: any) {
        console.warn(`  [Warn] Could not patch user ${u.id}:`, err.message);
      }
    }
  }

  console.log('\n--- Production PostgreSQL Data Migration Complete ---');
}

importAll()
  .catch((e) => {
    console.error('Import error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
