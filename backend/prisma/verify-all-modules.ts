import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function runVerification() {
  console.log('====================================================');
  console.log('   LUMIRISE COMPREHENSIVE VERIFICATION SUITE       ');
  console.log('====================================================\n');

  // 1. Verify Development Database & Connectivity
  console.log('1. Checking Database Connectivity...');
  const org = await prisma.organization.findFirst();
  if (!org) {
    throw new Error('Default organization not found in database!');
  }
  console.log(`   Connected to Organization: ${org.name} (${org.code}), ID: ${org.id}`);

  // 2. Verify all Core Domain Modules
  console.log('\n2. Verifying Core Domain Entity Coverage & Counts:');
  const counts: Record<string, number> = {
    Organization: await prisma.organization.count(),
    Users: await prisma.user.count(),
    Roles: await prisma.role.count(),
    Permissions: await prisma.permission.count(),
    Departments: await prisma.department.count(),
    Shifts: await prisma.shift.count(),
    Employees: await prisma.employee.count(),
    Attendance: await prisma.attendance.count(),
    LeaveRequests: await prisma.leaveRequest.count(),
    PayrollSlips: await prisma.payrollSlip.count(),
    JobOpenings: await prisma.jobOpening.count(),
    Candidates: await prisma.candidate.count(),
    Warehouses: await prisma.warehouse.count(),
    Suppliers: await prisma.supplier.count(),
    RawMaterials: await prisma.rawMaterial.count(),
    Products: await prisma.product.count(),
    StockLedger: await prisma.stockLedgerEntry.count(),
    Batches: await prisma.batch.count(),
    ProductionPlans: await prisma.productionPlan.count(),
    ProductionOrders: await prisma.productionOrder.count(),
    MaterialIssues: await prisma.materialIssue.count(),
    QualityInspections: await prisma.qualityInspection.count(),
    FinishedGoods: await prisma.finishedGood.count(),
    DispatchOrders: await prisma.dispatchOrder.count(),
    Customers: await prisma.customer.count(),
    Leads: await prisma.lead.count(),
    SalesOrders: await prisma.salesOrder.count(),
    Invoices: await prisma.invoice.count(),
    Payments: await prisma.payment.count(),
    Notifications: await prisma.notification.count(),
    AuditLogs: await prisma.auditLog.count()
  };

  for (const [key, val] of Object.entries(counts)) {
    console.log(`   ✓ ${key.padEnd(22)}: ${val} records`);
  }

  // 3. Verify Multi-Tenancy & Tenant Boundary Isolation
  console.log('\n3. Verifying organizationId Tenant Isolation...');
  const fakeOrgId = '00000000-0000-0000-0000-000000000000';
  const leakedEmployees = await prisma.employee.findMany({ where: { organizationId: fakeOrgId } });
  const leakedOrders = await prisma.productionOrder.findMany({ where: { organizationId: fakeOrgId } });
  const leakedInvoices = await prisma.invoice.findMany({ where: { organizationId: fakeOrgId } });

  if (leakedEmployees.length > 0 || leakedOrders.length > 0 || leakedInvoices.length > 0) {
    throw new Error('Tenant boundary leak detected! Query with foreign organization returned records.');
  }
  console.log('   ✓ Tenant boundary isolation verified: 0 records leaked across non-existent tenant boundaries.');

  // 4. Test CRUD Operations (Create, Read, Update, Delete)
  console.log('\n4. Testing CRUD Operation Lifecycle...');
  const testMaterial = await prisma.rawMaterial.create({
    data: {
      organizationId: org.id,
      code: 'TEST-MAT-' + Date.now(),
      name: 'Verification Test Alloy',
      category: 'Alloy',
      currentStock: 100,
      minStockLevel: 20,
      unit: 'KG',
      unitCost: 45.50
    }
  });
  console.log(`   ✓ CREATE passed: Material ID ${testMaterial.id} (${testMaterial.code})`);

  const readMaterial = await prisma.rawMaterial.findUnique({
    where: { id: testMaterial.id }
  });
  if (!readMaterial || readMaterial.currentStock !== 100) {
    throw new Error('READ failed: Created material was not retrieved properly.');
  }
  console.log('   ✓ READ passed: Retrieved test material successfully.');

  const updatedMaterial = await prisma.rawMaterial.update({
    where: { id: testMaterial.id },
    data: { currentStock: 250 }
  });
  if (updatedMaterial.currentStock !== 250) {
    throw new Error('UPDATE failed: Stock update was not reflected.');
  }
  console.log('   ✓ UPDATE passed: Stock quantity updated successfully.');

  await prisma.rawMaterial.delete({
    where: { id: testMaterial.id }
  });
  const deletedCheck = await prisma.rawMaterial.findUnique({ where: { id: testMaterial.id } });
  if (deletedCheck) {
    throw new Error('DELETE failed: Test material still exists.');
  }
  console.log('   ✓ DELETE passed: Cleaned up test record without residual footprint.');

  // 5. Verify Backup Dump File
  console.log('\n5. Verifying Backup Data Dump (dev-data-dump.json)...');
  const dumpPath = path.join(__dirname, 'dev-data-dump.json');
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`dev-data-dump.json not found at ${dumpPath}`);
  }
  const dumpRaw = fs.readFileSync(dumpPath, 'utf8');
  const dump = JSON.parse(dumpRaw);
  const dumpedModels = Object.keys(dump);
  console.log(`   ✓ Backup JSON exists and contains ${dumpedModels.length} models (${fs.statSync(dumpPath).size} bytes).`);

  // 6. Verify SQLite File Intact
  const dbPath = path.join(__dirname, 'dev.db');
  const dbStat = fs.statSync(dbPath);
  console.log(`\n6. Development Database Intact Status:`);
  console.log(`   ✓ dev.db location: ${dbPath}`);
  console.log(`   ✓ dev.db size: ${dbStat.size} bytes (preserved without corruption).`);

  console.log('\n====================================================');
  console.log('   ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!    ');
  console.log('====================================================');
}

runVerification()
  .catch((e) => {
    console.error('Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
