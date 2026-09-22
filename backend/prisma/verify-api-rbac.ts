import { PrismaClient } from '@prisma/client';

const API_BASE = 'http://localhost:5000/api';

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

async function testEndpoint(name: string, token: string, path: string, method = 'GET', body?: any) {
  const opts: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  const status = res.status;
  let json: any = null;
  try {
    json = await res.json();
  } catch {}
  return { status, json };
}

async function run() {
  console.log('================================================================');
  console.log('   LIVE BACKEND API RBAC VERIFICATION                           ');
  console.log('================================================================\n');

  // 1. Authenticate Roles
  console.log('1. Authenticating Roles...');
  const accountantAuth = await postLogin('accountant@apex.com');
  console.log(`✓ Accountant logged in: ${accountantAuth.user.email} (Role: ${accountantAuth.user.roleName}, ${accountantAuth.user.permissions.length} perms)`);

  const warehouseAuth = await postLogin('warehouse@apex.com');
  console.log(`✓ Warehouse Manager logged in: ${warehouseAuth.user.email} (Role: ${warehouseAuth.user.roleName}, ${warehouseAuth.user.permissions.length} perms)`);

  const prodManagerAuth = await postLogin('production@apex.com');
  console.log(`✓ Production Manager logged in: ${prodManagerAuth.user.email} (Role: ${prodManagerAuth.user.roleName}, ${prodManagerAuth.user.permissions.length} perms)`);

  const employeeAuth = await postLogin('operator@apex.com');
  console.log(`✓ Employee logged in: ${employeeAuth.user.email} (Role: ${employeeAuth.user.roleName}, ${employeeAuth.user.permissions.length} perms)`);

  // 2. Test ACCOUNTANT accessing /inventory/batches (Expected: 403 Forbidden)
  console.log('\n2. Testing ACCOUNTANT accessing /inventory/batches:');
  const accBatches = await testEndpoint('Accountant Batches', accountantAuth.token, '/inventory/batches');
  console.log(`   Status: HTTP ${accBatches.status}`);
  console.log(`   Response Code: ${accBatches.json?.code}`);
  console.log(`   Message: ${accBatches.json?.message}`);
  if (accBatches.status === 403 && accBatches.json?.code === 'FORBIDDEN_PERMISSION') {
    console.log('   ✓ PASS: Accountant is strictly denied HTTP 403 with clean user-friendly forbidden message!');
  } else {
    throw new Error(`Expected HTTP 403 Forbidden, got ${accBatches.status}`);
  }

  // 3. Test WAREHOUSE_MANAGER accessing /inventory/batches (Expected: 200 OK)
  console.log('\n3. Testing WAREHOUSE_MANAGER accessing /inventory/batches:');
  const whBatches = await testEndpoint('Warehouse Batches', warehouseAuth.token, '/inventory/batches');
  console.log(`   Status: HTTP ${whBatches.status}`);
  if (whBatches.status === 200) {
    console.log(`   ✓ PASS: Warehouse Manager has authorized access (returned ${whBatches.json?.length || 0} batches).`);
  } else {
    throw new Error(`Expected HTTP 200 OK, got ${whBatches.status}`);
  }

  // 4. Test ACCOUNTANT accessing Invoices (Authorized business responsibility)
  console.log('\n4. Testing ACCOUNTANT accessing Invoices:');
  const accInvoices = await testEndpoint('Accountant Invoices', accountantAuth.token, '/crm/invoices');
  console.log(`   Status: HTTP ${accInvoices.status}`);
  if (accInvoices.status === 200) {
    console.log(`   ✓ PASS: Accountant successfully accesses authorized invoices (${accInvoices.json?.length || 0} invoices).`);
  } else {
    throw new Error(`Expected HTTP 200 OK, got ${accInvoices.status}`);
  }

  // 5. Test EMPLOYEE accessing unauthorized Employee Directory (Expected: 403 Forbidden)
  console.log('\n5. Testing EMPLOYEE accessing HRMS employees list:');
  const empEmployees = await testEndpoint('Employee Employees List', employeeAuth.token, '/hrms/employees');
  console.log(`   Status: HTTP ${empEmployees.status}`);
  if (empEmployees.status === 403) {
    console.log('   ✓ PASS: Standard employee strictly denied access to full employee directory!');
  } else {
    throw new Error(`Expected HTTP 403 Forbidden, got ${empEmployees.status}`);
  }

  // 6. Test PRODUCTION_MANAGER creating raw material master data (Expected: 403 inventory.manage)
  console.log('\n6. Testing PRODUCTION_MANAGER master data creation restriction (Data Visibility vs Action):');
  const prodMatCreate = await testEndpoint('Prod Manager Material Create', prodManagerAuth.token, '/inventory/raw-materials', 'POST', {
    code: 'TEST-MAT-999',
    name: 'Unauthorized Material',
  });
  console.log(`   Status: HTTP ${prodMatCreate.status}`);
  if (prodMatCreate.status === 403) {
    console.log('   ✓ PASS: Production Manager has material view permission but CANNOT create/manage master inventory data (Action Permission isolated)!');
  } else {
    throw new Error(`Expected HTTP 403 Forbidden, got ${prodMatCreate.status}`);
  }

  console.log('\n================================================================');
  console.log('   ALL LIVE API SECURITY CHECKS PASSED SUCCESSFULLY!            ');
  console.log('================================================================\n');
}

run().catch((e) => {
  console.error('API Verification Failed:', e);
  process.exit(1);
});
