import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd(), '..');
const webRoot = path.join(repoRoot, 'web');
const read = (relativePath) => fs.readFileSync(path.join(webRoot, relativePath), 'utf8');

describe('website 9+ performance guardrails', () => {
  it('self-hosts the primary font with next/font instead of render-blocking Google stylesheet links', () => {
    const layout = read('src/app/layout.tsx');
    assert.match(layout, /from ['"]next\/font\/google['"]/);
    assert.match(layout, /display:\s*['"]swap['"]/);
    assert.doesNotMatch(layout, /fonts\.googleapis\.com/);
    assert.doesNotMatch(layout, /fonts\.gstatic\.com/);
  });

  it('enables app-wide production optimization settings', () => {
    const config = read('next.config.js');
    assert.match(config, /optimizePackageImports/);
    assert.match(config, /lucide-react/);
    assert.match(config, /formats:\s*\[\s*['"]image\/avif['"],\s*['"]image\/webp['"]\s*\]/);
    assert.match(config, /minimumCacheTTL:\s*86400/);
  });

  it('sets long-lived cache headers for public static assets and manifest files', () => {
    const config = read('next.config.js');
    assert.match(config, /Cache-Control/);
    assert.match(config, /max-age=31536000, immutable/);
    assert.match(config, /manifest\.webmanifest/);
  });

  it('preserves resilient dashboard API behavior for fast navigation', () => {
    const apiConfig = read('src/services/api/config.ts');
    const examService = read('src/services/api/examBoardService.ts');
    assert.match(apiConfig, /fetchCachedJson/);
    assert.match(apiConfig, /AbortController/);
    assert.match(apiConfig, /allowStaleOnError/);
    assert.match(examService, /fetchVerifiedPracticeAvailability/);
  });
});
