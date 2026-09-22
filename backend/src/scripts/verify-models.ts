import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const models = [
  'organization','role','permission','department','shift','leaveType',
  'user','employee','attendance','leaveRequest','jobOpening','candidate',
  'onboardingTask','payrollPeriod','payrollSlip','performanceReview',
  'warehouse','supplier','rawMaterial','product','batch','stockLedgerEntry',
  'stockTransfer','productionPlan','productionOrder','materialIssue',
  'qualityInspection','finishedGood','dispatchOrder','customer','lead',
  'quotation','salesOrder','invoice','payment','notification','auditLog'
];
(async () => {
  let ok=0, empty=0;
  for (const m of models) {
    try {
      const count = await (prisma as any)[m].count();
      const tag = count > 0 ? '  OK' : 'EMPTY';
      if (count > 0) ok++; else empty++;
      console.log(tag + ' ' + m.padEnd(22) + ': ' + count);
    } catch(e:any) { console.log('FAIL ' + m + ': ' + e.message); }
  }
  console.log('---');
  console.log('Models with data: ' + ok + '/' + models.length);
  console.log('Empty models: ' + empty);
  await prisma.$disconnect();
})();
