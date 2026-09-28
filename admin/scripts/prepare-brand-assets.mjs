import { access } from 'node:fs/promises';
import path from 'node:path';

await access(path.join(process.cwd(), 'public', 'logos', 'app-icon.jfif'));
console.log('Verified supplied THE GUIDE admin brand asset.');
