/** Local SVGs from flag-icons (MIT), pinned in package-lock.json. */
import fs from 'node:fs/promises';
const source = 'node_modules/flag-icons';
const destination = 'public/identity/flags';
await fs.mkdir(destination, { recursive: true });
await fs.cp(`${source}/flags/4x3`, destination, { recursive: true });
await fs.copyFile(`${source}/LICENSE`, `${destination}/LICENSE`);
const files = (await fs.readdir(destination)).filter(name => name.endsWith('.svg'));
await fs.writeFile('src/components/passport/flag-codes.json', JSON.stringify(files.map(name => name.slice(0, -4).toUpperCase()).sort(), null, 2) + '\n');
console.log(`Prepared ${files.length} local SVG flags.`);
