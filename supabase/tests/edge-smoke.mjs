import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const token = process.env.TEST_ACCESS_TOKEN;
const functionsRoot = path.resolve(process.cwd(), 'functions');

if (!supabaseUrl) {
  console.error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.');
  process.exit(2);
}

const functions = fs.existsSync(functionsRoot)
  ? fs.readdirSync(functionsRoot, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('_'))
      .map(entry => entry.name)
      .sort()
  : [];

assert.ok(functions.length > 0, `No Supabase Edge Functions found in ${functionsRoot}`);

const base = supabaseUrl.replace(/\/$/, '') + '/functions/v1';

async function call(name, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${base}/${name}`, {
      redirect: 'manual',
      ...options,
      signal: controller.signal,
      headers: { apikey: anonKey, ...(options.headers || {}) },
    });
    const text = await response.text();
    return { response, text };
  } finally {
    clearTimeout(timer);
  }
}

for (const name of functions) {
  const options = await call(name, { method: 'OPTIONS' });
  assert.ok(options.response.status < 500, `${name} OPTIONS returned ${options.response.status}: ${options.text}`);

  const allowOrigin = options.response.headers.get('access-control-allow-origin');
  assert.ok(allowOrigin, `${name} OPTIONS missing access-control-allow-origin`);

  const get = await call(name, { method: 'GET' });
  assert.ok(get.response.status < 500, `${name} GET returned ${get.response.status}: ${get.text}`);

  const invalid = await call(name, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({}),
  });
  assert.ok(invalid.response.status < 500, `${name} invalid POST returned ${invalid.response.status}: ${invalid.text}`);
  assert.ok(
    invalid.response.headers.get('content-type')?.includes('application/json') || invalid.response.status === 405,
    `${name} invalid POST did not return JSON/405`,
  );

  if (token) {
    const unsupported = await call(name, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: '__test_unsupported_action__' }),
    });
    assert.ok(
      unsupported.response.status < 500,
      `${name} unsupported action returned ${unsupported.response.status}: ${unsupported.text}`,
    );
  }

  console.log(`PASS ${name}: OPTIONS=${options.response.status}, GET=${get.response.status}, invalid POST=${invalid.response.status}`);
}

console.log(`Edge smoke suite passed for ${functions.length} discovered functions: ${functions.join(', ')}.`);
