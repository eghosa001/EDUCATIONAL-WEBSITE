import { access } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const required = [
  'public/logos/primary-logo.jfif',
  'public/logos/dark-mode-silver.jfif',
  'public/logos/app-icon.jfif',
  'public/logos/brand-light.svg',
  'public/logos/brand-dark.svg',
];

await Promise.all(required.map(file => access(path.join(root, file))));
console.log('Verified supplied THE GUIDE brand assets.');
