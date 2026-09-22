import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Lumirise Enterprise Database with Granular RBAC Permissions...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.dispatchOrder.deleteMany();
  await prisma.finishedGood.deleteMany();
  await prisma.qualityInspection.deleteMany();
  await prisma.materialIssue.deleteMany();
  await prisma.productionOrder.deleteMany();
  await prisma.productionPlan.deleteMany();
  await prisma.stockTransfer.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.stockLedgerEntry.deleteMany();
  await prisma.product.deleteMany();
  await prisma.rawMaterial.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.performanceReview.deleteMany();
  await prisma.payrollSlip.deleteMany();
  await prisma.payrollPeriod.deleteMany();
  await prisma.onboardingTask.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.jobOpening.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.user.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.department.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.organization.deleteMany();

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Apex Precision Manufacturing Ltd.',
      code: 'APEX-MFG',
      industry: 'Precision Engineering & Aerospace',
      size: '250-500',
      country: 'United States',
      email: 'contact@apexprecision.com',
      phone: '+1 (555) 234-5678',
      address: '4200 Industrial Parkway, Suite 100, Cleveland, OH',
      currency: 'USD',
    },
  });

  // 2. Define Master Roles
  const roleAdmin = await prisma.role.create({
    data: {
      organizationId: org.id,
      name: 'ADMIN',
      description: 'Super Admin / Organization Owner with full workspace access',
      isSystem: true,
    },
  });

  const roleProdMgr = await prisma.role.create({
    data: {
      organizationId: org.id,
      name: 'PRODUCTION_MANAGER',
      description: 'Manages production plans, orders, shopfloor execution, and quality',
      isSystem: true,
    },
  });

  const roleWarehouseMgr = await prisma.role.create({
    data: {
      organizationId: org.id,
      name: 'WAREHOUSE_MANAGER',
      description: 'Oversees inventory, depots, stock movements, and logistics',
      isSystem: true,
    },
  });

  const roleHrMgr = await prisma.role.create({
    data: {
      organizationId: org.id,
      name: 'HR_MANAGER',
      description: 'Manages people, departments, shifts, attendance, leaves, hiring, and payroll',
      isSystem: true,
    },
  });

  const roleAccountant = await prisma.role.create({
    data: {
      organizationId: org.id,
      name: 'ACCOUNTANT',
      description: 'Oversees customer accounts, sales orders, invoices, payments, and payroll review',
      isSystem: true,
    },
  });

  const roleProdEmployee = await prisma.role.create({
    data: {
      organizationId: org.id,
      name: 'PRODUCTION_EMPLOYEE',
      description: 'Shopfloor technician with access to assigned work orders, tasks, and attendance',
      isSystem: true,
    },
  });

  const roleWhEmployee = await prisma.role.create({
    data: {
      organizationId: org.id,
      name: 'WAREHOUSE_EMPLOYEE',
      description: 'Warehouse handler with access to stock in/out, batches, and shift tasks',
      isSystem: true,
    },
  });

  const roleEmployee = await prisma.role.create({
    data: {
      organizationId: org.id,
      name: 'EMPLOYEE',
      description: 'Standard employee self-service portal (attendance, leaves, payslips, profile)',
      isSystem: true,
    },
  });

  // 3. Define Permissions Mapping per Role
  const allPermissionCodes = [
    'dashboard.view',
    'production.view', 'production.create', 'production.manage',
    'quality.view', 'quality.manage',
    'finished_goods.view', 'dispatch.view', 'dispatch.manage',
    'inventory.view', 'inventory.manage',
    'warehouse.view', 'warehouse.manage',
    'stock.view', 'stock.manage',
    'supplier.view', 'supplier.manage',
    'employees.view', 'employees.manage',
    'attendance.view', 'attendance.manage',
    'leave.view', 'leave.manage',
    'recruitment.view', 'recruitment.manage',
    'payroll.view', 'payroll.manage',
    'customers.view', 'customers.manage',
    'leads.view', 'leads.manage',
    'sales_orders.view', 'sales_orders.manage',
    'invoices.view', 'invoices.manage',
    'payments.view', 'payments.manage',
    'reports.view', 'reports.production', 'reports.inventory', 'reports.hr', 'reports.financial',
    'settings.view', 'users.manage', 'roles.manage',
    'audit.view',
    // Self service permissions
    'employee_portal.view',
    'my_profile.view', 'my_tasks.view', 'my_orders.view', 'my_attendance.view',
    'my_leave.view', 'my_payslips.view', 'my_performance.view', 'my_documents.view',
  ];

  const rolePermissionMap: Record<string, string[]> = {
    ADMIN: allPermissionCodes,
    PRODUCTION_MANAGER: [
      'dashboard.view',
      'production.view', 'production.create', 'production.manage',
      'quality.view', 'quality.manage',
      'finished_goods.view', 'dispatch.view',
      'inventory.view', 'stock.view',
      'reports.view', 'reports.production',
      'my_profile.view', 'my_attendance.view', 'my_leave.view',
    ],
    WAREHOUSE_MANAGER: [
      'dashboard.view',
      'inventory.view', 'inventory.manage',
      'warehouse.view', 'warehouse.manage',
      'stock.view', 'stock.manage',
      'supplier.view', 'supplier.manage',
      'finished_goods.view',
      'dispatch.view', 'dispatch.manage',
      'reports.view', 'reports.inventory',
      'my_profile.view', 'my_attendance.view', 'my_leave.view',
    ],
    HR_MANAGER: [
      'dashboard.view',
      'employees.view', 'employees.manage',
      'attendance.view', 'attendance.manage',
      'leave.view', 'leave.manage',
      'recruitment.view', 'recruitment.manage',
      'payroll.view', 'payroll.manage',
      'reports.view', 'reports.hr',
      'my_profile.view', 'my_attendance.view', 'my_leave.view',
    ],
    ACCOUNTANT: [
      'dashboard.view',
      'customers.view', 'customers.manage',
      'sales_orders.view',
      'invoices.view', 'invoices.manage',
      'payments.view', 'payments.manage',
      'payroll.view',
      'reports.view', 'reports.financial',
      'my_profile.view', 'my_attendance.view', 'my_leave.view',
    ],
    PRODUCTION_EMPLOYEE: [
      'dashboard.view',
      'employee_portal.view',
      'my_tasks.view', 'my_orders.view', 'my_attendance.view', 'my_leave.view',
      'my_performance.view', 'my_documents.view', 'my_profile.view',
    ],
    WAREHOUSE_EMPLOYEE: [
      'dashboard.view',
      'employee_portal.view',
      'my_tasks.view', 'stock.view', 'stock.manage', 'warehouse.view',
      'my_attendance.view', 'my_leave.view', 'my_documents.view', 'my_profile.view',
    ],
    EMPLOYEE: [
      'dashboard.view',
      'employee_portal.view',
      'my_profile.view', 'my_attendance.view', 'my_leave.view',
      'my_payslips.view', 'my_performance.view', 'my_documents.view', 'my_tasks.view',
    ],
  };

  const roleObjMap: Record<string, any> = {
    ADMIN: roleAdmin,
    PRODUCTION_MANAGER: roleProdMgr,
    WAREHOUSE_MANAGER: roleWarehouseMgr,
    HR_MANAGER: roleHrMgr,
    ACCOUNTANT: roleAccountant,
    PRODUCTION_EMPLOYEE: roleProdEmployee,
    WAREHOUSE_EMPLOYEE: roleWhEmployee,
    EMPLOYEE: roleEmployee,
  };

  for (const [roleKey, perms] of Object.entries(rolePermissionMap)) {
    const role = roleObjMap[roleKey];
    for (const code of perms) {
      const parts = code.split('.');
      await prisma.permission.create({
        data: {
          roleId: role.id,
          code,
          module: parts[0].toUpperCase(),
          action: parts[1]?.toUpperCase() || 'VIEW',
        },
      });
    }
  }

  // 4. Create Departments
  const deptOperations = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: 'Manufacturing & Machining',
      code: 'MACH',
      description: 'CNC Milling, Turning, and Precision Sub-Assembly lines',
    },
  });

  const deptQA = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: 'Quality Assurance',
      code: 'QA',
      description: 'Metrology lab, NDT inspection, and regulatory compliance',
    },
  });

  const deptSCM = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: 'Supply Chain & Logistics',
      code: 'SCM',
      description: 'Warehousing, raw material receiving, and dispatch shipping',
    },
  });

  const deptHR = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: 'Human Resources',
      code: 'HR',
      description: 'Talent management, payroll, compliance, and workplace culture',
    },
  });

  const deptFinance = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: 'Finance & Accounting',
      code: 'FIN',
      description: 'Corporate ledger, invoicing, receivables, and treasury',
    },
  });

  // 5. Create Shifts
  const shiftMorning = await prisma.shift.create({
    data: {
      organizationId: org.id,
      name: 'Morning Shift',
      code: 'SFT-MORN',
      startTime: '06:00',
      endTime: '14:00',
    },
  });

  const shiftGeneral = await prisma.shift.create({
    data: {
      organizationId: org.id,
      name: 'General Shift',
      code: 'SFT-GEN',
      startTime: '09:00',
      endTime: '18:00',
    },
  });

  // 6. Create Employees & Users for all 8 Personas
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Admin / Super Admin
  const empAdmin = await prisma.employee.create({
    data: {
      organizationId: org.id,
      employeeCode: 'EMP-1001',
      firstName: 'Arthur',
      lastName: 'Vance',
      email: 'admin@apex.com',
      phone: '+1 (555) 101-2001',
      departmentId: deptOperations.id,
      designation: 'Managing Director / Executive Admin',
      roleId: roleAdmin.id,
      shiftId: shiftGeneral.id,
      joiningDate: new Date('2021-01-15'),
      basicSalary: 12500,
      status: 'ACTIVE',
    },
  });
  await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'admin@apex.com',
      passwordHash,
      firstName: 'Arthur',
      lastName: 'Vance',
      roleId: roleAdmin.id,
      employeeId: empAdmin.id,
      status: 'ACTIVE',
    },
  });

  // 2. Production Manager
  const empProdMgr = await prisma.employee.create({
    data: {
      organizationId: org.id,
      employeeCode: 'EMP-1002',
      firstName: 'Marcus',
      lastName: 'Chen',
      email: 'production@apex.com',
      phone: '+1 (555) 101-2002',
      departmentId: deptOperations.id,
      designation: 'Production Operations Manager',
      roleId: roleProdMgr.id,
      shiftId: shiftMorning.id,
      managerId: empAdmin.id,
      joiningDate: new Date('2022-03-01'),
      basicSalary: 8500,
      status: 'ACTIVE',
    },
  });
  await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'production@apex.com',
      passwordHash,
      firstName: 'Marcus',
      lastName: 'Chen',
      roleId: roleProdMgr.id,
      employeeId: empProdMgr.id,
      status: 'ACTIVE',
    },
  });

  // 3. Warehouse Manager
  const empWarehouse = await prisma.employee.create({
    data: {
      organizationId: org.id,
      employeeCode: 'EMP-1004',
      firstName: 'David',
      lastName: 'Kowalski',
      email: 'warehouse@apex.com',
      phone: '+1 (555) 101-2004',
      departmentId: deptSCM.id,
      designation: 'Warehouse & Logistics Supervisor',
      roleId: roleWarehouseMgr.id,
      shiftId: shiftMorning.id,
      managerId: empAdmin.id,
      joiningDate: new Date('2022-09-10'),
      basicSalary: 6200,
      status: 'ACTIVE',
    },
  });
  await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'warehouse@apex.com',
      passwordHash,
      firstName: 'David',
      lastName: 'Kowalski',
      roleId: roleWarehouseMgr.id,
      employeeId: empWarehouse.id,
      status: 'ACTIVE',
    },
  });

  // 4. HR Manager
  const empHrMgr = await prisma.employee.create({
    data: {
      organizationId: org.id,
      employeeCode: 'EMP-1003',
      firstName: 'Elena',
      lastName: 'Rostova',
      email: 'hr@apex.com',
      phone: '+1 (555) 101-2003',
      departmentId: deptHR.id,
      designation: 'Head of People & HR',
      roleId: roleHrMgr.id,
      shiftId: shiftGeneral.id,
      managerId: empAdmin.id,
      joiningDate: new Date('2022-06-15'),
      basicSalary: 7800,
      status: 'ACTIVE',
    },
  });
  await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'hr@apex.com',
      passwordHash,
      firstName: 'Elena',
      lastName: 'Rostova',
      roleId: roleHrMgr.id,
      employeeId: empHrMgr.id,
      status: 'ACTIVE',
    },
  });

  // 5. Accountant
  const empAccountant = await prisma.employee.create({
    data: {
      organizationId: org.id,
      employeeCode: 'EMP-1005',
      firstName: 'Sophia',
      lastName: 'Bennett',
      email: 'accountant@apex.com',
      phone: '+1 (555) 101-2005',
      departmentId: deptFinance.id,
      designation: 'Lead Financial Controller & Accountant',
      roleId: roleAccountant.id,
      shiftId: shiftGeneral.id,
      managerId: empAdmin.id,
      joiningDate: new Date('2022-11-01'),
      basicSalary: 7200,
      status: 'ACTIVE',
    },
  });
  await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'accountant@apex.com',
      passwordHash,
      firstName: 'Sophia',
      lastName: 'Bennett',
      roleId: roleAccountant.id,
      employeeId: empAccountant.id,
      status: 'ACTIVE',
    },
  });

  // 6. Production Employee / CNC Operator
  const empProdOp = await prisma.employee.create({
    data: {
      organizationId: org.id,
      employeeCode: 'EMP-1025',
      firstName: 'Ravi',
      lastName: 'Kumar',
      email: 'prod.emp@apex.com',
      phone: '+1 (555) 101-2025',
      departmentId: deptOperations.id,
      designation: 'Lead CNC Machinist & Operator',
      roleId: roleProdEmployee.id,
      shiftId: shiftMorning.id,
      managerId: empProdMgr.id,
      joiningDate: new Date('2023-02-15'),
      basicSalary: 4500,
      status: 'ACTIVE',
    },
  });
  await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'prod.emp@apex.com',
      passwordHash,
      firstName: 'Ravi',
      lastName: 'Kumar',
      roleId: roleProdEmployee.id,
      employeeId: empProdOp.id,
      status: 'ACTIVE',
    },
  });

  // 7. Warehouse Employee
  const empWhOp = await prisma.employee.create({
    data: {
      organizationId: org.id,
      employeeCode: 'EMP-1028',
      firstName: 'Liam',
      lastName: 'Scott',
      email: 'wh.emp@apex.com',
      phone: '+1 (555) 101-2028',
      departmentId: deptSCM.id,
      designation: 'Warehouse Handler & Forklift Lead',
      roleId: roleWhEmployee.id,
      shiftId: shiftMorning.id,
      managerId: empWarehouse.id,
      joiningDate: new Date('2023-04-10'),
      basicSalary: 4200,
      status: 'ACTIVE',
    },
  });
  await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'wh.emp@apex.com',
      passwordHash,
      firstName: 'Liam',
      lastName: 'Scott',
      roleId: roleWhEmployee.id,
      employeeId: empWhOp.id,
      status: 'ACTIVE',
    },
  });

  // 8. Normal Employee / QA Tech
  const empNormal = await prisma.employee.create({
    data: {
      organizationId: org.id,
      employeeCode: 'EMP-1030',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'operator@apex.com',
      phone: '+1 (555) 101-2030',
      departmentId: deptQA.id,
      designation: 'Metrology Lab Technician',
      roleId: roleEmployee.id,
      shiftId: shiftMorning.id,
      managerId: empProdMgr.id,
      joiningDate: new Date('2023-05-20'),
      basicSalary: 5400,
      status: 'ACTIVE',
    },
  });
  await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'operator@apex.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      roleId: roleEmployee.id,
      employeeId: empNormal.id,
      status: 'ACTIVE',
    },
  });

  // 7. Attendance Records
  const today = new Date().toISOString().split('T')[0];
  const allEmployees = [empAdmin, empProdMgr, empWarehouse, empHrMgr, empAccountant, empProdOp, empWhOp, empNormal];
  for (const emp of allEmployees) {
    await prisma.attendance.create({
      data: {
        organizationId: org.id,
        employeeId: emp.id,
        date: today,
        checkIn: '06:00',
        status: emp.employeeCode === 'EMP-1025' ? 'LATE' : 'PRESENT',
        shiftId: emp.shiftId,
        workHours: 7.8,
      },
    });
  }

  // 8. Leave Types & Requests
  const leaveAnnual = await prisma.leaveType.create({
    data: { organizationId: org.id, name: 'Paid Annual Leave', daysAllowed: 18 },
  });
  await prisma.leaveRequest.create({
    data: {
      organizationId: org.id,
      employeeId: empProdOp.id,
      leaveTypeId: leaveAnnual.id,
      startDate: '2026-09-28',
      endDate: '2026-09-30',
      days: 3,
      reason: 'Family wedding attendance',
      status: 'PENDING',
    },
  });

  // 9. Job Openings & Candidates
  const jobCNC = await prisma.jobOpening.create({
    data: {
      organizationId: org.id,
      title: 'Senior CNC 5-Axis Mill Specialist',
      departmentId: deptOperations.id,
      openings: 2,
      experience: '5+ years aerospace precision machining',
      salaryRange: '$65,000 - $80,000',
      location: 'Cleveland Plant 1',
      status: 'OPEN',
      description: 'Program, setup and operate Mazak and DMG Mori 5-axis machining centers.',
    },
  });
  await prisma.candidate.create({
    data: {
      organizationId: org.id,
      jobOpeningId: jobCNC.id,
      name: 'Jason Miller',
      email: 'jason.m.machinist@example.com',
      phone: '+1 (555) 782-9912',
      stage: 'INTERVIEW',
      rating: 5,
      notes: 'Strong experience on Siemens 840D and Fanuc 31i controllers.',
    },
  });

  // 10. Payroll Period & Slips
  const payrollPeriod = await prisma.payrollPeriod.create({
    data: {
      organizationId: org.id,
      month: 9,
      year: 2026,
      name: 'September 2026 Payrun',
      status: 'PROCESSING',
      totalAmount: 51300,
    },
  });

  for (const emp of allEmployees) {
    await prisma.payrollSlip.create({
      data: {
        organizationId: org.id,
        payrollPeriodId: payrollPeriod.id,
        employeeId: emp.id,
        basicSalary: emp.basicSalary,
        allowances: 600,
        overtime: 250,
        deductions: 350,
        netSalary: emp.basicSalary + 600 + 250 - 350,
        status: 'APPROVED',
      },
    });
  }

  // 11. Warehouses & Suppliers
  const whRaw = await prisma.warehouse.create({
    data: {
      organizationId: org.id,
      name: 'Central Raw Material Depot',
      code: 'WH-RAW-01',
      location: 'Building A, High Bay Racks 1-12',
      capacity: '1,500 sq meters',
    },
  });

  const whFinished = await prisma.warehouse.create({
    data: {
      organizationId: org.id,
      name: 'Finished Goods Logistics Center',
      code: 'WH-FG-02',
      location: 'Building C, Climate Controlled Bay',
      capacity: '800 sq meters',
    },
  });

  const supplierTitanium = await prisma.supplier.create({
    data: {
      organizationId: org.id,
      code: 'SUP-101',
      name: 'Titanium Aerospace Alloys Corp.',
      contactPerson: 'Robert Hastings',
      email: 'orders@titaniumalloys.com',
      phone: '+1 (555) 890-1234',
      address: '900 Alloy Way, Pittsburgh, PA',
      rating: 4.9,
    },
  });

  const supplierSeals = await prisma.supplier.create({
    data: {
      organizationId: org.id,
      code: 'SUP-102',
      name: 'Precision Seals & Elastomers Ltd.',
      contactPerson: 'Claire Bennett',
      email: 'sales@precisionseals.com',
      phone: '+1 (555) 789-6543',
      address: '22 O-Ring Drive, Akron, OH',
      rating: 4.7,
    },
  });

  // 12. Raw Materials
  const rmTitanium = await prisma.rawMaterial.create({
    data: {
      organizationId: org.id,
      code: 'RM-TI-01',
      name: 'Grade 5 Titanium Bar (60mm dia)',
      category: 'Metals & Alloys',
      unit: 'kg',
      unitCost: 85.0,
      minStockLevel: 250,
      currentStock: 1200,
      supplierId: supplierTitanium.id,
    },
  });

  const rmSeals = await prisma.rawMaterial.create({
    data: {
      organizationId: org.id,
      code: 'RM-VT-04',
      name: 'Viton Cryogenic Flange Seals',
      category: 'Polymers & Seals',
      unit: 'pcs',
      unitCost: 14.2,
      minStockLevel: 500,
      currentStock: 320, // LOW STOCK ALERT
      supplierId: supplierSeals.id,
    },
  });

  // 13. Products
  const prdValve = await prisma.product.create({
    data: {
      organizationId: org.id,
      sku: 'PRD-CV-900',
      name: 'Cryogenic Control Valve Assembly 4-Inch',
      category: 'Precision Valves',
      description: 'Hermetically sealed multi-stage cryogenic shutoff valve.',
      unit: 'pcs',
      unitPrice: 1850.0,
      costPrice: 940.0,
      minStockLevel: 25,
      currentStock: 48,
    },
  });

  const prdActuator = await prisma.product.create({
    data: {
      organizationId: org.id,
      sku: 'PRD-HA-450',
      name: 'High-Pressure Hydraulic Rotary Actuator',
      category: 'Actuation Systems',
      description: 'Double-acting rack and pinion hydraulic actuator.',
      unit: 'pcs',
      unitPrice: 2450.0,
      costPrice: 1250.0,
      minStockLevel: 15,
      currentStock: 12,
    },
  });

  // 14. Stock Ledger & Batches
  await prisma.stockLedgerEntry.create({
    data: {
      organizationId: org.id,
      warehouseId: whRaw.id,
      itemType: 'RAW_MATERIAL',
      itemId: rmTitanium.id,
      itemName: rmTitanium.name,
      transactionType: 'STOCK_IN',
      quantity: 500,
      balanceAfter: 1200,
      referenceNumber: 'GRN-2026-904',
      batchNumber: 'BATCH-TI-2026-A',
      createdByName: 'David Kowalski',
    },
  });

  await prisma.batch.create({
    data: {
      organizationId: org.id,
      batchNumber: 'BATCH-TI-2026-A',
      itemType: 'RAW_MATERIAL',
      itemId: rmTitanium.id,
      itemName: rmTitanium.name,
      quantity: 500,
      initialQuantity: 500,
      manufacturingDate: '2026-08-10',
      status: 'RELEASED',
    },
  });

  // 15. Production Plans & Orders
  const prodPlan = await prisma.productionPlan.create({
    data: {
      organizationId: org.id,
      planNumber: 'PLAN-2026-Q3-01',
      title: 'Aerospace Valve Assembly Run - Q3 Delivery',
      startDate: '2026-09-01',
      endDate: '2026-10-15',
      status: 'IN_PROGRESS',
    },
  });

  const prodOrder1 = await prisma.productionOrder.create({
    data: {
      organizationId: org.id,
      orderNumber: 'PO-1025',
      productionPlanId: prodPlan.id,
      productId: prdValve.id,
      targetQuantity: 150,
      completedQuantity: 85,
      rejectedQuantity: 2,
      status: 'IN_PROGRESS',
      startDate: '2026-09-10',
      dueDate: '2026-09-28',
      shiftId: shiftMorning.id,
      assignedSupervisorId: empProdMgr.id,
      notes: 'Valve spindle assembly underway on Line 2.',
    },
  });

  const prodOrder2 = await prisma.productionOrder.create({
    data: {
      organizationId: org.id,
      orderNumber: 'PO-1026',
      productionPlanId: prodPlan.id,
      productId: prdActuator.id,
      targetQuantity: 80,
      completedQuantity: 80,
      rejectedQuantity: 1,
      status: 'QUALITY_CHECK',
      startDate: '2026-09-05',
      dueDate: '2026-09-24',
      shiftId: shiftMorning.id,
      assignedSupervisorId: empProdMgr.id,
      notes: 'Completed machining. Awaiting metrology signoff.',
    },
  });

  await prisma.materialIssue.create({
    data: {
      organizationId: org.id,
      productionOrderId: prodOrder1.id,
      rawMaterialId: rmTitanium.id,
      quantityRequired: 300,
      quantityIssued: 300,
      status: 'ISSUED',
    },
  });

  // 16. Quality Inspections
  await prisma.qualityInspection.create({
    data: {
      organizationId: org.id,
      inspectionNumber: 'QA-8801',
      stage: 'FINISHED_PRODUCT',
      referenceType: 'ProductionOrder',
      referenceNumber: 'PO-1026',
      itemName: prdActuator.name,
      inspectorName: 'Sarah Jenkins',
      sampleSize: 15,
      defectsCount: 0,
      status: 'PASS',
      notes: 'Hydrostatic pressure test passed up to 350 bar with zero micro-leakage.',
    },
  });

  await prisma.qualityInspection.create({
    data: {
      organizationId: org.id,
      inspectionNumber: 'QA-8803',
      stage: 'IN_PROCESS',
      referenceType: 'ProductionOrder',
      referenceNumber: 'PO-1025',
      itemName: prdValve.name,
      inspectorName: 'Sarah Jenkins',
      sampleSize: 10,
      defectsCount: 1,
      status: 'HOLD',
      notes: 'Thread tolerance variance on valve bonnet spindle. Calibration required.',
    },
  });

  // 17. Finished Goods & Dispatch
  await prisma.finishedGood.create({
    data: {
      organizationId: org.id,
      productionOrderId: prodOrder2.id,
      productId: prdActuator.id,
      batchNumber: 'BATCH-HA-2026-09',
      quantity: 80,
      warehouseId: whFinished.id,
      status: 'IN_STOCK',
    },
  });

  await prisma.dispatchOrder.create({
    data: {
      organizationId: org.id,
      dispatchNumber: 'DSP-4401',
      salesOrderNumber: 'SO-9011',
      customerName: 'Boeing Defense Systems',
      carrier: 'FedEx Freight Priority',
      trackingNumber: 'FX-8891029311',
      dispatchDate: '2026-09-20',
      status: 'DISPATCHED',
      itemSummary: '45x Cryogenic Control Valve Assembly',
      totalItems: 45,
      destination: 'Boeing Plant 2, Seattle, WA',
    },
  });

  // 18. Customers & Leads
  const custBoeing = await prisma.customer.create({
    data: {
      organizationId: org.id,
      code: 'CUST-001',
      name: 'Boeing Defense Systems',
      company: 'The Boeing Company',
      email: 'procurement@boeing.com',
      creditLimit: 500000,
      status: 'ACTIVE',
    },
  });

  const custSiemens = await prisma.customer.create({
    data: {
      organizationId: org.id,
      code: 'CUST-003',
      name: 'Siemens Energy Turbines',
      company: 'Siemens Energy AG',
      email: 'turbine.orders@siemens-energy.com',
      creditLimit: 250000,
      status: 'ACTIVE',
    },
  });

  await prisma.lead.create({
    data: {
      organizationId: org.id,
      name: 'General Electric Aviation',
      company: 'GE Aerospace',
      email: 'turbomachinery@ge.com',
      source: 'TRADE_SHOW',
      status: 'PROPOSAL',
      estimatedValue: 280000,
      assignedToName: 'Arthur Vance',
    },
  });

  // 19. Sales Orders, Invoices, Payments
  const salesOrder1 = await prisma.salesOrder.create({
    data: {
      organizationId: org.id,
      orderNumber: 'SO-9011',
      customerId: custBoeing.id,
      orderDate: '2026-09-01',
      deliveryDate: '2026-09-25',
      subtotal: 138750,
      tax: 11100,
      total: 149850,
      status: 'IN_PRODUCTION',
      itemsJson: JSON.stringify([
        { sku: 'PRD-CV-900', name: 'Cryogenic Control Valve Assembly 4-Inch', quantity: 75, unitPrice: 1850 },
      ]),
    },
  });

  const inv1 = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      invoiceNumber: 'INV-2026-101',
      salesOrderId: salesOrder1.id,
      customerId: custBoeing.id,
      invoiceDate: '2026-09-15',
      dueDate: '2026-10-15',
      subtotal: 138750,
      tax: 11100,
      total: 149850,
      amountPaid: 149850,
      status: 'PAID',
      itemsJson: JSON.stringify([
        { sku: 'PRD-CV-900', name: 'Cryogenic Control Valve Assembly 4-Inch', quantity: 75, unitPrice: 1850 },
      ]),
    },
  });

  await prisma.payment.create({
    data: {
      organizationId: org.id,
      paymentNumber: 'PAY-8801',
      invoiceId: inv1.id,
      customerId: custBoeing.id,
      amount: 149850,
      paymentDate: '2026-09-18',
      method: 'WIRE',
      reference: 'WIRE-BOEING-FED-9921',
      notes: 'Wire received in full via Chase Treasury.',
    },
  });

  // 20. Notifications & Audit Logs
  await prisma.notification.create({
    data: {
      organizationId: org.id,
      title: 'Low Stock Alert: Viton Flange Seals',
      message: 'Viton Cryogenic Flange Seals are at 320 pcs (below minimum threshold of 500 pcs).',
      type: 'ALERT',
      link: '/inventory/raw-materials',
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      userName: 'Arthur Vance',
      action: 'INIT',
      entity: 'System',
      details: 'RBAC permissions matrix established for all 8 roles.',
    },
  });

  console.log('🎉 Database Seeded with Granular Permissions and 8 Master Personas!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
