import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'brand-assets', 'the-guide-mark.webp.b64');
const outputDir = path.join(root, 'public', 'logos');
await mkdir(outputDir, { recursive: true });
const encoded = (await readFile(source, 'utf8')).trim();
await writeFile(path.join(outputDir, 'the-guide-mark.webp'), Buffer.from(encoded, 'base64'));
console.log('THE GUIDE admin brand asset prepared.');
