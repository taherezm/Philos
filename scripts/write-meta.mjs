import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..', ':philos-data:library');
const meta = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, 'all-meta.json'), 'utf-8'));

let written = 0;
for (const entry of meta) {
  const dir = path.join(ROOT, entry._dir);
  const file = path.join(dir, entry._file + '.meta.json');
  if (fs.existsSync(file)) { console.log('SKIP', file); continue; }
  const { _dir, _file, ...data } = entry;
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  written++;
}
console.log(`Wrote ${written} .meta.json files`);
