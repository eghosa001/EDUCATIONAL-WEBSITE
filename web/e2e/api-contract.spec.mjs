import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const API_ROOT = path.resolve(process.cwd(), 'src/app/api');
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function walk(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}
function routeFromFile(file) {
  const rel = path.relative(API_ROOT, file).split(path.sep).join('/');
  if (!/^.*\/route\.(ts|tsx|js|jsx)$/.test('/' + rel)) return null;
  return '/api/' + rel.replace(/\/route\.(ts|tsx|js|jsx)$/, '').split('/').filter(Boolean).join('/');
}
function methodsFromSource(file) {
  const src = fs.readFileSync(file, 'utf8');
  return HTTP_METHODS.filter(method => new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\b|export\\s*\\{[^}]*\\b${method}\\b`, 'm').test(src));
}
function isDynamic(route) { return /\[[^\]]+\]/.test(route); }

const files = walk(API_ROOT).filter(file => /\/route\.(ts|tsx|js|jsx)$/.test(file));
const inventory = files.map(file => ({ file, route: routeFromFile(file), methods: methodsFromSource(file) })).filter(x => x.route);

test.describe('Next.js API route contract suite', () => {
  test('every route file exports at least one HTTP handler', () => {
    expect(inventory.length).toBeGreaterThan(0);
    for (const item of inventory) {
      expect(item.methods.length, `${item.file} exports no HTTP method`).toBeGreaterThan(0);
    }
  });

  for (const item of inventory.filter(x => !isDynamic(x.route))) {
    for (const method of item.methods) {
      test(`${method} ${item.route} does not return a server error`, async ({ request }) => {
        const response = await request.fetch(item.route, {
          method,
          data: MUTATING.has(method) ? {} : undefined,
          headers: MUTATING.has(method) ? { 'content-type': 'application/json' } : undefined,
          timeout: 20000,
        }).catch(() => null);
        expect(response, `${method} ${item.route} could not be reached`).not.toBeNull();
        expect(response.status(), `${method} ${item.route} returned HTTP 5xx`).toBeLessThan(500);
      });
    }
  }
});
