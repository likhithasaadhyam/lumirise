import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function exportAll() {
  console.log('--- Exporting Lumirise SQLite Data to JSON ---');
  const data: Record<string, any[]> = {};
  const counts: Record<string, number> = {};

  const modelNames = Object.keys(prisma).filter(
    (key) =>
      !key.startsWith('$') &&
      !key.startsWith('_') &&
      typeof (prisma as any)[key]?.findMany === 'function'
  );

  console.log(`Discovered ${modelNames.length} Prisma models:`, modelNames.join(', '));

  for (const model of modelNames) {
    try {
      const records = await (prisma as any)[model].findMany();
      data[model] = records;
      counts[model] = records.length;
    } catch (err: any) {
      console.warn(`Could not export model ${model}:`, err.message);
    }
  }

  console.log('--- Exported Record Counts ---');
  console.table(counts);

  const outputPath = path.join(__dirname, 'dev-data-dump.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`\nSuccessfully exported data to ${outputPath} (${fs.statSync(outputPath).size} bytes)`);
}

if (require.main === module) {
  exportAll()
    .catch((e) => {
      console.error('Export error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
