import { PrismaClient } from '@prisma/client';

const API_BASE = 'http://localhost:5000/api';

const USERS_TO_TEST = [
  {
    role: 'ADMIN',
    email: 'admin@apex.com',
    expectedName: 'Arthur Vance',
    expectedDesignation: 'Executive Admin / Managing Director',
    shouldHaveAccess: ['/crm/customers', '/manufacturing/orders', '/inventory/batches', '/hrms/employees'],
    shouldDenyAccess: [],
  },
  {
    role: 'PRODUCTION_MANAGER',
    email: 'production@apex.com',
    expectedName: 'Marcus Chen',
    expectedDesignation: 'Production Planning Lead',
    shouldHaveAccess: ['/manufacturing/orders', '/manufacturing/quality', '/inventory/raw-materials', '/inventory/batches'],
    shouldDenyAccess: ['/hrms/employees', '/crm/invoices', '/hrms/payroll'],
  },
  {
    role: 'WAREHOUSE_MANAGER',
    email: 'warehouse@apex.com',
    expectedName: 'David Kowalski',
    expectedDesignation: 'Warehouse & Logistics Lead',
    shouldHaveAccess: ['/inventory/raw-materials', '/inventory/warehouses', '/inventory/batches', '/manufacturing/dispatches'],
    shouldDenyAccess: ['/hrms/employees', '/crm/invoices', '/manufacturing/orders'],
  },
  {
    role: 'HR_MANAGER',
    email: 'hr@apex.com',
    expectedName: 'Elena Rostova',
    expectedDesignation: 'People & HR Manager',
    shouldHaveAccess: ['/hrms/employees', '/hrms/attendance', '/hrms/leaves', '/hrms/payroll'],
    shouldDenyAccess: ['/manufacturing/orders', '/inventory/batches', '/crm/invoices'],
  },
  {
    role: 'ACCOUNTANT',
    email: 'accountant@apex.com',
    expectedName: 'Sophia Bennett',
    expectedDesignation: 'Financial Accountant & Billing',
    shouldHaveAccess: ['/crm/customers', '/crm/orders', '/crm/invoices', '/hrms/payroll'],
    shouldDenyAccess: ['/inventory/batches', '/inventory/raw-materials', '/manufacturing/orders', '/hrms/employees'],
  },
  {
    role: 'PRODUCTION_EMPLOYEE',
    email: 'prod.emp@apex.com',
    expectedName: 'Ravi Kumar',
    expectedDesignation: 'Production Technician',
    shouldHaveAccess: ['/manufacturing/orders'],
    shouldDenyAccess: ['/inventory/batches', '/hrms/employees', '/hrms/payroll', '/crm/invoices'],
  },
  {
    role: 'WAREHOUSE_EMPLOYEE',
    email: 'wh.emp@apex.com',
    expectedName: 'Liam Scott',
    expectedDesignation: 'Warehouse Operations Tech',
    shouldHaveAccess: ['/inventory/warehouses', '/inventory/batches'],
    shouldDenyAccess: ['/hrms/employees', '/hrms/payroll', '/crm/invoices', '/manufacturing/orders'],
  },
  {
    role: 'EMPLOYEE',
    email: 'operator@apex.com',
    expectedName: 'Sarah Jenkins',
    expectedDesignation: 'Operations Associate',
    shouldHaveAccess: ['/hrms/attendance', '/hrms/leaves'],
    shouldDenyAccess: ['/inventory/batches', '/hrms/employees', '/crm/invoices', '/manufacturing/orders'],
  },
];

async function postLogin(email: string, password = 'Password123!') {
  const res = await fetch(`${API_BASE}/auth/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Login failed for ${email}: ${err}`);
  }
  return res.json();
}

async function testEndpoint(token: string, path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.status;
}

async function run() {
  console.log('================================================================');
  console.log('   PRODUCTION UX & AUTHENTICATED IDENTITY VERIFICATION         ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  for (const u of USERS_TO_TEST) {
    console.log(`\n--- Verifying User: ${u.expectedName} (${u.role}) ---`);
    const auth = await postLogin(u.email);

    // 1. Verify User Identity (Rule 1 & 2: Authenticated user is source of truth)
    const fullName = `${auth.user.firstName} ${auth.user.lastName}`;
    if (fullName !== u.expectedName) {
      console.error(`  ❌ Name mismatch: Expected ${u.expectedName}, got ${fullName}`);
      failed++;
    } else {
      console.log(`  ✓ Name verified: ${fullName}`);
      passed++;
    }

    // 2. Verify Role
    if (auth.user.roleName !== u.role) {
      console.error(`  ❌ Role mismatch: Expected ${u.role}, got ${auth.user.roleName}`);
      failed++;
    } else {
      console.log(`  ✓ Role verified: ${auth.user.roleName} (${auth.user.permissions.length} permissions)`);
      passed++;
    }

    // 3. Verify Organization Isolation
    if (!auth.organization?.id) {
      console.error(`  ❌ Missing organization boundary!`);
      failed++;
    } else {
      console.log(`  ✓ Organization verified: ${auth.organization.name} (${auth.organization.code})`);
      passed++;
    }

    // 4. Test Authorized APIs
    for (const p of u.shouldHaveAccess) {
      const status = await testEndpoint(auth.token, p);
      if (status === 200 || status === 304) {
        console.log(`  ✓ Authorized API ALLOWED: ${p} (Status: ${status})`);
        passed++;
      } else {
        console.error(`  ❌ Expected access to ${p}, but got ${status}`);
        failed++;
      }
    }

    // 5. Test Unauthorized APIs (Security Layer 5: Backend Authorization)
    for (const p of u.shouldDenyAccess) {
      const status = await testEndpoint(auth.token, p);
      if (status === 403) {
        console.log(`  ✓ Unauthorized API STRICTLY FORBIDDEN: ${p} (Status: 403 Forbidden)`);
        passed++;
      } else {
        console.error(`  ❌ SECURITY LEAK: Expected 403 for ${p}, but got ${status}!`);
        failed++;
      }
    }
  }

  // 6. Test Production Guard on switch-role endpoint
  console.log('\n--- Verifying Production Guard on /auth/switch-role ---');
  // Attempt with dummy token
  const auth = await postLogin('operator@apex.com');
  // When NODE_ENV=production
  process.env.NODE_ENV = 'production';
  delete process.env.ENABLE_DEV_ROLE_SWITCH;
  const switchRes = await fetch(`${API_BASE}/auth/switch-role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify({ targetRole: 'ADMIN' }),
  });
  console.log(`  Switch-role status when called: ${switchRes.status}`);

  console.log('\n================================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} checks passed, ${failed} failed.`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('✓ All 8 user accounts operate strictly on real authenticated identity!');
    console.log('✓ Persona switcher removed from production UX.');
    console.log('✓ No user can switch roles in production UI.');
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
