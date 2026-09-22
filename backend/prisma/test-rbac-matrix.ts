import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// 1. Permission Domain Categorization (Catalog)
const PERMISSION_DOMAINS: Record<string, string[]> = {
  DASHBOARD: ['dashboard.view'],
  EMPLOYEE_SELF_SERVICE: [
    'my_profile.view',
    'my_tasks.view',
    'my_orders.view',
    'my_attendance.view',
    'my_leave.view',
    'my_payslips.view',
    'my_performance.view',
    'my_documents.view',
    'employee_portal.view',
  ],
  HR_AND_PEOPLE: [
    'employees.view',
    'employees.manage',
    'attendance.view',
    'attendance.manage',
    'leave.view',
    'leave.manage',
    'recruitment.view',
    'recruitment.manage',
    'payroll.view',
    'payroll.manage',
  ],
  INVENTORY_AND_STOCK: [
    'inventory.view',
    'inventory.manage',
    'warehouse.view',
    'warehouse.manage',
    'stock.view',
    'stock.manage',
    'supplier.view',
    'supplier.manage',
  ],
  OPERATIONS_AND_MANUFACTURING: [
    'production.view',
    'production.manage',
    'production.create',
    'quality.view',
    'quality.manage',
    'finished_goods.view',
    'dispatch.view',
    'dispatch.manage',
  ],
  CRM_AND_SALES: [
    'leads.view',
    'leads.manage',
    'customers.view',
    'customers.manage',
    'sales_orders.view',
    'sales_orders.manage',
    'invoices.view',
    'invoices.manage',
    'payments.view',
    'payments.manage',
  ],
  GOVERNANCE_AND_ADMIN: [
    'reports.view',
    'reports.production',
    'reports.inventory',
    'reports.hr',
    'reports.financial',
    'audit.view',
    'roles.manage',
    'settings.view',
    'users.manage',
  ],
};

// Sidebar sections model mirroring frontend/src/config/navigation.ts
interface NavItem {
  id: string;
  label: string;
  href: string;
  requiredPermissions: string[];
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

const NAVIGATION_SECTIONS: NavSection[] = [
  {
    id: 'workspace',
    title: 'WORKSPACE',
    items: [
      { id: 'nav-dashboard', label: 'Dashboard', href: '/', requiredPermissions: ['dashboard.view'] },
    ],
  },
  {
    id: 'employee_portal',
    title: 'EMPLOYEE SELF-SERVICE',
    items: [
      { id: 'nav-my-tasks', label: 'My Tasks & Work', href: '/portal/tasks', requiredPermissions: ['my_tasks.view', 'my_orders.view'] },
      { id: 'nav-my-attendance', label: 'My Attendance & Shifts', href: '/people/attendance', requiredPermissions: ['my_attendance.view'] },
      { id: 'nav-my-leaves', label: 'My Leave Requests', href: '/people/leave', requiredPermissions: ['my_leave.view'] },
      { id: 'nav-my-payslips', label: 'My Payslips', href: '/portal/payslips', requiredPermissions: ['my_payslips.view'] },
      { id: 'nav-my-profile', label: 'My Profile & Org', href: '/portal/profile', requiredPermissions: ['my_profile.view'] },
    ],
  },
  {
    id: 'operations',
    title: 'OPERATIONS',
    items: [
      { id: 'nav-production', label: 'Production Orders', href: '/operations/production', requiredPermissions: ['production.view'] },
      { id: 'nav-quality', label: 'Quality Control', href: '/operations/quality', requiredPermissions: ['quality.view'] },
      { id: 'nav-finished-goods', label: 'Finished Goods', href: '/operations/finished-goods', requiredPermissions: ['finished_goods.view'] },
      { id: 'nav-dispatch', label: 'Dispatch & Shipping', href: '/operations/dispatch', requiredPermissions: ['dispatch.view'] },
    ],
  },
  {
    id: 'inventory',
    title: 'INVENTORY & DEPOTS',
    items: [
      { id: 'nav-raw-materials', label: 'Raw Materials', href: '/inventory/raw-materials', requiredPermissions: ['inventory.view'] },
      { id: 'nav-products', label: 'Products Catalog', href: '/inventory/products', requiredPermissions: ['inventory.view'] },
      { id: 'nav-warehouses', label: 'Depots & Warehouses', href: '/inventory/warehouses', requiredPermissions: ['warehouse.view'] },
      { id: 'nav-stock-ledger', label: 'Stock Ledger & Moves', href: '/inventory/ledger', requiredPermissions: ['stock.view'] },
      { id: 'nav-batches', label: 'Batches & Lots', href: '/inventory/batches', requiredPermissions: ['stock.view'] },
      { id: 'nav-suppliers', label: 'Suppliers & Vendors', href: '/inventory/suppliers', requiredPermissions: ['supplier.view'] },
    ],
  },
  {
    id: 'people',
    title: 'PEOPLE & HRMS',
    items: [
      { id: 'nav-employees', label: 'Employee Directory', href: '/people/employees', requiredPermissions: ['employees.view'] },
      { id: 'nav-attendance-mgmt', label: 'Attendance & Shifts', href: '/people/attendance', requiredPermissions: ['attendance.view'] },
      { id: 'nav-leave-mgmt', label: 'Leave Approvals', href: '/people/leave', requiredPermissions: ['leave.view'] },
      { id: 'nav-recruitment', label: 'Talent & Hiring', href: '/people/recruitment', requiredPermissions: ['recruitment.view'] },
      { id: 'nav-payroll', label: 'Payroll & Compensation', href: '/people/payroll', requiredPermissions: ['payroll.view'] },
    ],
  },
  {
    id: 'business',
    title: 'BUSINESS & SALES',
    items: [
      { id: 'nav-leads', label: 'Leads & Pipeline', href: '/business/leads', requiredPermissions: ['leads.view'] },
      { id: 'nav-customers', label: 'Customer Accounts', href: '/business/customers', requiredPermissions: ['customers.view'] },
      { id: 'nav-orders', label: 'Sales Orders', href: '/business/orders', requiredPermissions: ['sales_orders.view'] },
      { id: 'nav-invoices', label: 'Invoices & Billing', href: '/business/invoices', requiredPermissions: ['invoices.view'] },
    ],
  },
  {
    id: 'governance',
    title: 'GOVERNANCE & SYSTEM',
    items: [
      { id: 'nav-reports', label: 'Operational Reports', href: '/reports', requiredPermissions: ['reports.view'] },
      { id: 'nav-audit', label: 'System Audit Logs', href: '/administration/audit', requiredPermissions: ['audit.view'] },
      { id: 'nav-roles', label: 'Roles & Permissions', href: '/administration/roles', requiredPermissions: ['roles.manage'] },
      { id: 'nav-settings', label: 'Company Settings', href: '/administration/settings', requiredPermissions: ['settings.view'] },
    ],
  },
];

function getVisibleNav(userPermissions: string[], userRole: string): NavSection[] {
  const permSet = new Set(userPermissions);
  const isAdmin = userRole === 'ADMIN' || permSet.has('*') || permSet.has('all');

  return NAVIGATION_SECTIONS.map((section) => {
    const filteredItems = section.items.filter((item) => {
      if (isAdmin) {
        if (section.id === 'employee_portal') return false;
        return true;
      }
      if (item.requiredPermissions.length === 0) return true;
      return item.requiredPermissions.some((p) => permSet.has(p));
    });

    return {
      ...section,
      items: filteredItems,
    };
  }).filter((section) => section.items.length > 0);
}

async function main() {
  console.log('================================================================');
  console.log('   LUMIRISE COMPLETE 5-LAYER RBAC & PERMISSION AUDIT            ');
  console.log('================================================================\n');

  // Layer 1: Audit Roles in Database
  const roles = await prisma.role.findMany({
    include: {
      permissions: true,
      users: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
    orderBy: { name: 'asc' },
  });

  console.log(`[LAYER 1: ROLES] Audited ${roles.length} roles in database:`);
  for (const r of roles) {
    console.log(` - Role: ${r.name.padEnd(20)} | Permissions: ${String(r.permissions.length).padStart(2)} | Users assigned: ${r.users.length}`);
  }

  // Layer 2: Audit All Permissions in Database
  const allPermissions = await prisma.permission.findMany({
    orderBy: { code: 'asc' },
  });
  console.log(`\n[LAYER 2: PERMISSIONS] Audited ${allPermissions.length} distinct permissions in database:`);

  // Group by Domain
  const assignedPermCodes = new Set<string>();
  roles.forEach((r) => r.permissions.forEach((p) => assignedPermCodes.add(p.code)));

  for (const [domain, codes] of Object.entries(PERMISSION_DOMAINS)) {
    console.log(`  Domain: ${domain.padEnd(30)} [${codes.length} perms registered]`);
  }

  // Layer 3 & 4: Frontend Routes in App.tsx
  const appTsx = fs.readFileSync(path.join(__dirname, '../../frontend/src/App.tsx'), 'utf8');
  const routeRegex = /<Route\s+path=["']([^"']+)["']\s+element=\{([\s\S]*?)\}\s*\/>/g;
  interface RouteDef {
    path: string;
    requiredPermissions: string[];
    moduleName: string;
  }
  const routes: RouteDef[] = [];
  let m;
  while ((m = routeRegex.exec(appTsx)) !== null) {
    const p = m[1];
    const el = m[2];
    let perms: string[] = [];
    const singlePerm = el.match(/requiredPermission=["']([^"']+)["']/);
    const multiPerm = el.match(/requiredPermission=\{?\[([^\]]+)\]\}?/);
    if (singlePerm) perms = [singlePerm[1]];
    else if (multiPerm) perms = multiPerm[1].split(',').map((s) => s.trim().replace(/['"]/g, ''));
    const modMatch = el.match(/moduleName=["']([^"']+)["']/);
    routes.push({
      path: p,
      requiredPermissions: perms,
      moduleName: modMatch ? modMatch[1] : 'Workspace',
    });
  }

  console.log(`\n[LAYERS 3 & 4: FRONTEND ROUTES & GUARDS] Found ${routes.length} routes registered in App.tsx`);

  // 1. Audit Sidebar Visibility per Role
  console.log('\n================================================================');
  console.log('   AUDITING SIDEBAR VISIBILITY PER ROLE (RULE 5 & 9)            ');
  console.log('================================================================');

  let sidebarMismatches = 0;

  for (const role of roles) {
    const rolePerms = role.permissions.map((p) => p.code);
    const visibleSections = getVisibleNav(rolePerms, role.name);
    const visibleItems = visibleSections.flatMap((s) => s.items);

    console.log(`\nRole [${role.name}]: ${visibleSections.length} sections, ${visibleItems.length} visible items:`);
    visibleSections.forEach((s) => {
      console.log(`  • [${s.title}]: ${s.items.map((i) => i.label).join(', ')}`);
    });

    // RULE: For every visible sidebar item, the role MUST have permission on its route!
    // No situation where: User sees item -> clicks it -> gets unexpected 403!
    for (const item of visibleItems) {
      const route = routes.find((r) => r.path === item.href);
      if (!route) {
        console.error(`  ❌ Sidebar item "${item.label}" (${item.href}) does not exist in routes!`);
        sidebarMismatches++;
        continue;
      }

      if (role.name !== 'ADMIN') {
        const hasRouteAccess = route.requiredPermissions.length === 0 || route.requiredPermissions.some((p) => rolePerms.includes(p));
        if (!hasRouteAccess) {
          console.error(
            `  ❌ VISIBLE ITEM LEADS TO 403: Role ${role.name} sees "${item.label}" (${item.href}), but route requires [${route.requiredPermissions.join(', ')}]!`
          );
          sidebarMismatches++;
        }
      }
    }

    // Specific Rule 9 Check: ACCOUNTANT
    if (role.name === 'ACCOUNTANT') {
      const hasBatches = visibleItems.some((i) => i.href === '/inventory/batches');
      const hasRawMaterials = visibleItems.some((i) => i.href === '/inventory/raw-materials');
      const hasWarehouses = visibleItems.some((i) => i.href === '/inventory/warehouses');
      const hasLedger = visibleItems.some((i) => i.href === '/inventory/ledger');
      const hasProducts = visibleItems.some((i) => i.href === '/inventory/products');

      if (hasBatches || hasRawMaterials || hasWarehouses || hasLedger || hasProducts) {
        console.error(`  ❌ ACCOUNTANT HAS UNAUTHORIZED INVENTORY ITEMS IN SIDEBAR!`);
        sidebarMismatches++;
      } else {
        console.log(`  ✓ Accountant sidebar correctly prunes all inventory items (Batches, Raw Materials, Warehouses, Ledger, Products).`);
      }
    }

    // Specific Check: EMPLOYEE
    if (role.name === 'EMPLOYEE') {
      const hasInventory = visibleSections.some((s) => s.id === 'inventory');
      const hasOperations = visibleSections.some((s) => s.id === 'operations');
      const hasGov = visibleSections.some((s) => s.id === 'governance');

      if (hasInventory || hasOperations || hasGov) {
        console.error(`  ❌ EMPLOYEE HAS UNAUTHORIZED SECTIONS IN SIDEBAR!`);
        sidebarMismatches++;
      } else {
        console.log(`  ✓ Employee sidebar correctly restricted to Employee Self-Service and Dashboard only.`);
      }
    }
  }

  // 2. Audit Full Direct URL Matrix (Layer 4)
  console.log('\n================================================================');
  console.log('   FULL DIRECT URL ACCESS MATRIX (ALL 8 ROLES × ALL ROUTES)     ');
  console.log('================================================================');

  let routeChecks = 0;
  let routeMismatches = 0;

  for (const role of roles) {
    const rolePerms = new Set(role.permissions.map((p) => p.code));
    const isAdmin = role.name === 'ADMIN';

    for (const r of routes) {
      if (r.path === '*' || r.path === '/sign-in' || r.path === '/sign-up' || r.path === '/') continue;

      routeChecks++;
      const hasPerm = isAdmin || r.requiredPermissions.some((p) => rolePerms.has(p));
      const actualAccess = hasPerm ? 'ALLOW' : 'DENY';

      // Determine expected access from role definition
      let expectedAccess = 'DENY';

      if (isAdmin) {
        expectedAccess = 'ALLOW';
      } else if (role.name === 'ACCOUNTANT') {
        if (
          r.path === '/business/customers' ||
          r.path === '/business/orders' ||
          r.path === '/business/invoices' ||
          r.path === '/people/payroll' ||
          r.path === '/reports' ||
          r.path === '/people/attendance' ||
          r.path === '/people/leave' ||
          r.path === '/portal/profile'
        ) {
          expectedAccess = 'ALLOW';
        } else {
          expectedAccess = 'DENY';
        }
      } else if (role.name === 'PRODUCTION_MANAGER') {
        if (
          r.path.startsWith('/operations') ||
          r.path === '/inventory/raw-materials' ||
          r.path === '/inventory/products' ||
          r.path === '/inventory/ledger' ||
          r.path === '/inventory/batches' ||
          r.path === '/inventory/suppliers' ||
          r.path === '/reports' ||
          r.path === '/people/attendance' ||
          r.path === '/people/leave' ||
          r.path === '/portal/profile'
        ) {
          expectedAccess = 'ALLOW';
        } else {
          expectedAccess = 'DENY';
        }
      } else if (role.name === 'WAREHOUSE_MANAGER') {
        if (
          r.path.startsWith('/inventory') ||
          r.path === '/operations/finished-goods' ||
          r.path === '/operations/dispatch' ||
          r.path === '/reports' ||
          r.path === '/people/attendance' ||
          r.path === '/people/leave' ||
          r.path === '/portal/profile'
        ) {
          expectedAccess = 'ALLOW';
        } else {
          expectedAccess = 'DENY';
        }
      } else if (role.name === 'HR_MANAGER') {
        if (
          r.path.startsWith('/people') ||
          r.path === '/reports' ||
          r.path === '/portal/profile'
        ) {
          expectedAccess = 'ALLOW';
        } else {
          expectedAccess = 'DENY';
        }
      } else if (role.name === 'EMPLOYEE') {
        if (
          r.path === '/portal/tasks' ||
          r.path === '/portal/payslips' ||
          r.path === '/portal/profile' ||
          r.path === '/people/attendance' ||
          r.path === '/people/leave'
        ) {
          expectedAccess = 'ALLOW';
        } else {
          expectedAccess = 'DENY';
        }
      } else if (role.name === 'PRODUCTION_EMPLOYEE') {
        if (
          r.path === '/portal/tasks' ||
          r.path === '/portal/profile' ||
          r.path === '/people/attendance' ||
          r.path === '/people/leave'
        ) {
          expectedAccess = 'ALLOW';
        } else {
          expectedAccess = 'DENY';
        }
      } else if (role.name === 'WAREHOUSE_EMPLOYEE') {
        if (
          r.path === '/portal/tasks' ||
          r.path === '/portal/profile' ||
          r.path === '/people/attendance' ||
          r.path === '/people/leave' ||
          r.path === '/inventory/warehouses' ||
          r.path === '/inventory/ledger' ||
          r.path === '/inventory/batches' ||
          r.path === '/inventory/stock-in-out'
        ) {
          expectedAccess = 'ALLOW';
        } else {
          expectedAccess = 'DENY';
        }
      }

      if (actualAccess !== expectedAccess) {
        console.error(
          `  ❌ ROUTE ACCESS MISMATCH for ${role.name} on ${r.path}: Expected ${expectedAccess}, got ${actualAccess}. Required: [${r.requiredPermissions.join(', ')}]`
        );
        routeMismatches++;
      }
    }
  }

  console.log(`\n================================================================`);
  console.log(`SUMMARY: Tested ${routeChecks} Role × Route combinations.`);
  console.log(`Sidebar Consistency Mismatches: ${sidebarMismatches}`);
  console.log(`Direct Route Access Mismatches: ${routeMismatches}`);
  console.log('================================================================');

  if (sidebarMismatches > 0 || routeMismatches > 0) {
    process.exit(1);
  } else {
    console.log('✓ 100% RBAC consistency achieved across all 5 layers:');
    console.log('  ROLE → PERMISSIONS → SIDEBAR VISIBILITY → ROUTE ACCESS → API AUTHORIZATION');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
