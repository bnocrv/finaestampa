import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');

const entries = [
  'index.html',
  'login.html',
  'table.html',
  'employees.html',
  'vehicles.html',
  'reports.html',
  'assets',
  'css',
  'js',
  'etiquetas',
  'expedicao',
  'public/_headers'
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const entry of entries) {
  await cp(join(root, entry), join(dist, entry.replace(/^public\//, '')), {
    recursive: true,
    force: true
  });
}

console.log('Static deploy files copied to dist.');
