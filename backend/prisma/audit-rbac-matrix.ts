import fs from 'fs';
import path from 'path';

const appTsx = fs.readFileSync(path.join(__dirname, '../../frontend/src/App.tsx'), 'utf8');
const navTs = fs.readFileSync(path.join(__dirname, '../../frontend/src/config/navigation.ts'), 'utf8');
const dump = JSON.parse(fs.readFileSync(path.join(__dirname, 'dev-data-dump.json'), 'utf8'));

import { NAVIGATION_SECTIONS } from '../../frontend/src/config/navigation';

console.log('========================================================');
console.log('   LUMIRISE RBAC & ROUTE CONSISTENCY AUDIT              ');
console.log('========================================================\n');

// 1. Parse App.tsx routes
interface RouteInfo {
  path: string;
  requiredPermission: string[];
  moduleName: string;
}

const routes: RouteInfo[] = [];
const routeRegex = /<Route\s+path=["']([^"']+)["']\s+element=\{([\s\S]*?)\}\s*\/>/g;
let match;
while ((match = routeRegex.exec(appTsx)) !== null) {
  const p = match[1];
  const el = match[2];
  let perms: string[] = [];
  const singlePerm = el.match(/requiredPermission=["']([^"']+)["']/);
  const multiPerm = el.match(/requiredPermission=\{?\[([^\]]+)\]\}?/);
  if (singlePerm) {
    perms = [singlePerm[1]];
  } else if (multiPerm) {
    perms = multiPerm[1].split(',').map((s) => s.trim().replace(/['"]/g, ''));
  }

  const moduleMatch = el.match(/moduleName=["']([^"']+)["']/);
  routes.push({
    path: p,
    requiredPermission: perms,
    moduleName: moduleMatch ? moduleMatch[1] : 'N/A',
  });
}

console.log(`Audited ${routes.length} Frontend Routes in App.tsx:`);
console.table(
  routes.map((r) => ({
    Path: r.path,
    ModuleName: r.moduleName,
    RequiredPermissions: r.requiredPermission.join(', ') || '(Public/Workspace)',
  }))
);

// 2. Parse Sidebar Items
console.log('\nAuditing Sidebar Navigation Items in navigation.ts:');
const navItems: Array<{ id: string; label: string; href: string; perms: string[]; section: string }> = [];
NAVIGATION_SECTIONS.forEach((section) => {
  section.items.forEach((item) => {
    navItems.push({
      id: item.id,
      label: item.label,
      href: item.href,
      perms: item.requiredPermissions,
      section: section.title,
    });
  });
});

console.table(
  navItems.map((n) => ({
    Section: n.section,
    Label: n.label,
    Href: n.href,
    RequiredPermissions: n.perms.join(', '),
  }))
);

// 3. Check Consistency: Does every NavItem have a matching Route in App.tsx?
console.log('\n--- Consistency Check: Sidebar Items vs App.tsx Routes ---');
let navMismatch = false;
for (const item of navItems) {
  const route = routes.find((r) => r.path === item.href);
  if (!route) {
    console.warn(`[MISMATCH] Sidebar item "${item.label}" (${item.href}) does NOT exist in App.tsx!`);
    navMismatch = true;
  } else {
    // Check if permissions match
    const routePerms = new Set(route.requiredPermission);
    const itemPerms = new Set(item.perms);
    const diff = [...itemPerms].filter((p) => !routePerms.has(p));
    if (diff.length > 0 && route.requiredPermission.length > 0) {
      console.warn(
        `[MISMATCH] Perm difference for "${item.label}" (${item.href}): Sidebar requires [${[...itemPerms]}], Route requires [${[...routePerms]}]`
      );
      navMismatch = true;
    }
  }
}

if (!navMismatch) {
  console.log('✓ All sidebar navigation items map directly to App.tsx routes with matching permissions!');
}
