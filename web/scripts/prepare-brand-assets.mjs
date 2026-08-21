import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceDir = path.join(root, 'brand-assets');
const publicDir = path.join(root, 'public', 'logos');

await mkdir(publicDir, { recursive: true });

const assets = [
  ['the-guide-mark.webp.b64', 'the-guide-mark.webp'],
  ['the-guide-wordmark.webp.b64', 'the-guide-wordmark.webp'],
];

for (const [source, target] of assets) {
  const encoded = (await readFile(path.join(sourceDir, source), 'utf8')).trim();
  await writeFile(path.join(publicDir, target), Buffer.from(encoded, 'base64'));
}

console.log('THE GUIDE brand assets prepared.');
