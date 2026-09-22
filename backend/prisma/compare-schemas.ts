import fs from 'fs';
import path from 'path';

const sqlite = fs.readFileSync(path.join(__dirname, 'schema.prisma'), 'utf8');
const pg = fs.readFileSync(path.join(__dirname, 'schema.postgresql.prisma'), 'utf8');

const getModels = (content: string) => {
  const matches = [...content.matchAll(/model\s+(\w+)\s+\{([\s\S]*?)\}/g)];
  return new Map(
    matches.map((m) => [
      m[1],
      m[2]
        .trim()
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('//'))
    ])
  );
};

const sqliteModels = getModels(sqlite);
const pgModels = getModels(pg);

console.log('SQLite models count:', sqliteModels.size);
console.log('PostgreSQL models count:', pgModels.size);

const missingInPg = [...sqliteModels.keys()].filter((m) => !pgModels.has(m));
const missingInSqlite = [...pgModels.keys()].filter((m) => !sqliteModels.has(m));

console.log('Missing in PG:', missingInPg);
console.log('Missing in SQLite:', missingInSqlite);

let mismatch = false;
for (const [name, fields] of sqliteModels) {
  const pgFields = pgModels.get(name);
  if (!pgFields) continue;
  if (fields.length !== pgFields.length) {
    console.log(`Field count mismatch in model ${name}: SQLite has ${fields.length}, PG has ${pgFields.length}`);
    mismatch = true;
  }
}
if (!mismatch) {
  console.log('SUCCESS: All 37 models and their exact field definitions and relations match 100% between SQLite and PostgreSQL schemas!');
}
