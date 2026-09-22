import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

/**
 * Lumirise Production Migration Helper
 * Imports the exported JSON development data dump into a target PostgreSQL database.
 * Run with: npx tsx prisma/import-to-postgres.ts
 */

const prisma = new PrismaClient();

export async function importAll() {
  const dumpPath = path.join(__dirname, 'dev-data-dump.json');
  if (!fs.existsSync(dumpPath)) {
    console.error(`Dump file not found at ${dumpPath}. Please run export-data.ts first.`);
    process.exit(1);
  }

  const raw = fs.readFileSync(dumpPath, 'utf8');
  const data: Record<string, any[]> = JSON.parse(raw);

  console.log('--- Importing Lumirise Development Data into PostgreSQL ---');

  // Insert in strict foreign-key dependency order
  const order: string[] = [
    'organization',
    'role',
    'permission',
    'department',
    'shift',
    'leaveType',
    'employee',
    'user',
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
        const parsedRecord = { ...record };
        for (const [key, val] of Object.entries(parsedRecord)) {
          if (
            typeof val === 'string' &&
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)
          ) {
            parsedRecord[key] = new Date(val);
          }
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

  console.log('\n--- Production PostgreSQL Data Migration Complete ---');
}

if (require.main === module) {
  importAll()
    .catch((e) => {
      console.error('Import error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
