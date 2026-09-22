import fs from 'fs';
import path from 'path';

// Load dump
const dump = JSON.parse(fs.readFileSync(path.join(__dirname, 'dev-data-dump.json'), 'utf8'));

// Extract NAVIGATION_SECTIONS from navigation.ts
import { NAVIGATION_SECTIONS, getVisibleNavigation } from '../../frontend/src/config/navigation';

console.log('========================================================');
console.log('   FULL ROLE & NAVIGATION CONSISTENCY AUDIT             ');
console.log('========================================================\n');

const roles = dump.role;

for (const role of roles) {
  const perms = dump.permission
    .filter((p: any) => p.roleId === role.id)
    .map((p: any) => p.code);

  console.log(`\n--------------------------------------------------------`);
  console.log(`ROLE: ${role.name} (${perms.length} permissions)`);
  console.log(`--------------------------------------------------------`);

  const visibleSections = getVisibleNavigation(perms, role.name);

  visibleSections.forEach((section) => {
    console.log(`  [Section: ${section.title}]`);
    section.items.forEach((item) => {
      console.log(`    • ${item.label.padEnd(25)} -> ${item.href} (Req: ${item.requiredPermissions.join(', ')})`);
    });
  });
}
