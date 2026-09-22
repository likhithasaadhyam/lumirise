import http from 'http';

const BASE_HOST = 'localhost';
const BASE_PORT = 5000;
const BASE_PATH = '/api';

function httpPost(path: string, body: object): Promise<{status:number, data:any}> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request({ host: BASE_HOST, port: BASE_PORT, path: BASE_PATH + path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }}, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve({status: res.statusCode!, data: JSON.parse(d)}); } catch(e) { resolve({status: res.statusCode!, data: d}); }});
    });
    req.on('error', reject); req.write(payload); req.end();
  });
}

function httpGet(path: string, token: string): Promise<{status:number, data:any}> {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: BASE_HOST, port: BASE_PORT, path: BASE_PATH + path, method: 'GET', headers: { 'Authorization': 'Bearer ' + token }}, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve({status: res.statusCode!, data: JSON.parse(d)}); } catch(e) { resolve({status: res.statusCode!, data: d}); }});
    });
    req.on('error', reject); req.end();
  });
}

const PASSWORD = 'Password123!';
const USERS = [
  { email: 'admin@apex.com',      label: 'Super Admin' },
  { email: 'production@apex.com', label: 'Production Manager' },
  { email: 'warehouse@apex.com',  label: 'Warehouse Manager' },
  { email: 'hr@apex.com',         label: 'HR Manager' },
  { email: 'accountant@apex.com', label: 'Accountant' },
  { email: 'prod.emp@apex.com',   label: 'Prod Employee' },
  { email: 'wh.emp@apex.com',     label: 'WH Employee' },
  { email: 'operator@apex.com',   label: 'Normal Employee' },
];

async function run() {
  let authPass = 0, authFail = 0;
  let adminToken = '';
  let adminOrgId = '';
  console.log('=== AUTH TEST (password: Password123!) ===');
  for (const u of USERS) {
    const r = await httpPost('/auth/sign-in', { email: u.email, password: PASSWORD });
    if (r.status === 200 && r.data.token) {
      const role = r.data.user?.roleName || r.data.roleName || '?';
      const perms = r.data.user?.permissions?.length || 0;
      console.log('  PASS ' + u.label.padEnd(22) + ' role=' + role + ' perms=' + perms);
      authPass++;
      if (u.email === 'admin@apex.com') adminToken = r.data.token;
    } else {
      console.log('  FAIL ' + u.label.padEnd(22) + ' HTTP ' + r.status + ' ' + (r.data.message || JSON.stringify(r.data).slice(0,80)));
      authFail++;
    }
  }
  console.log('Auth: ' + authPass + '/8 PASS, ' + authFail + ' FAIL\n');

  if (!adminToken) { console.log('No admin token - cannot continue.'); return; }

  console.log('=== TENANT ISOLATION TEST ===');
  const meR = await httpGet('/auth/me', adminToken);
  adminOrgId = meR.data.organizationId;
  console.log('  Admin has orgId:', adminOrgId ? 'YES (' + adminOrgId.slice(0,8) + '...)' : 'NO');

  const empR = await httpGet('/hrms/employees', adminToken);
  const employees = empR.data.employees || empR.data;
  if (Array.isArray(employees)) {
    const leaked = employees.filter((e: any) => e.organizationId && e.organizationId !== adminOrgId);
    console.log('  Employee count:', employees.length);
    console.log('  Cross-org leaks:', leaked.length === 0 ? 'NONE (PASS)' : leaked.length + ' LEAKED (FAIL)');
  } else {
    console.log('  /hrms/employees HTTP ' + empR.status);
  }

  console.log('\n=== CRUD SPOT CHECKS (Admin token) ===');
  const checks = [
    { label: 'HRMS employees',    path: '/hrms/employees' },
    { label: 'HRMS attendance',   path: '/hrms/attendance' },
    { label: 'HRMS payroll',      path: '/hrms/payroll' },
    { label: 'Inventory materials', path: '/inventory/raw-materials' },
    { label: 'Inventory products',  path: '/inventory/products' },
    { label: 'Production orders',   path: '/manufacturing/orders' },
    { label: 'CRM customers',       path: '/crm/customers' },
    { label: 'CRM invoices',        path: '/crm/invoices' },
    { label: 'Finance payroll',     path: '/hrms/payroll' },
    { label: 'Dashboard KPIs',      path: '/reports/dashboard-kpis' },
  ];
  let crudPass = 0, crudFail = 0;
  for (const c of checks) {
    const r = await httpGet(c.path, adminToken);
    const ok = r.status === 200;
    if (ok) crudPass++; else crudFail++;
    console.log('  ' + (ok ? 'PASS' : 'FAIL') + ' ' + c.label.padEnd(24) + ' HTTP ' + r.status);
  }
  console.log('CRUD: ' + crudPass + '/' + checks.length + ' PASS\n');

  console.log('=== SUMMARY ===');
  console.log('AUTH:             ' + (authFail === 0 ? 'PASS' : 'FAIL (' + authFail + ' failed)'));
  console.log('TENANT ISOLATION: see above');
  console.log('CRUD:             ' + (crudFail === 0 ? 'PASS' : 'FAIL (' + crudFail + ' endpoints failed)'));
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
