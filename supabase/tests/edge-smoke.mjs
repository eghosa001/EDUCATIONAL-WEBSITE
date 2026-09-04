import assert from 'node:assert/strict';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const token = process.env.TEST_ACCESS_TOKEN;
const functions = ['ai', 'analytics', 'lesson-worker', 'payments'];

if (!supabaseUrl) {
  console.error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.');
  process.exit(2);
}

const base = supabaseUrl.replace(/\/$/, '') + '/functions/v1';

async function call(name, options = {}) {
  const response = await fetch(`${base}/${name}`, {
    redirect: 'manual',
    ...options,
    headers: { apikey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', ...(options.headers || {}) },
  });
  const text = await response.text();
  return { response, text };
}

for (const name of functions) {
  const options = await call(name, { method: 'OPTIONS' });
  assert.ok(options.response.status < 500, `${name} OPTIONS returned ${options.response.status}: ${options.text}`);
  assert.equal(options.response.headers.get('access-control-allow-origin'), '*', `${name} missing CORS allow-origin`);

  const get = await call(name, { method: 'GET' });
  assert.ok(get.response.status < 500, `${name} GET returned ${get.response.status}: ${get.text}`);

  const invalid = await call(name, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({}),
  });
  assert.ok(invalid.response.status < 500, `${name} invalid POST returned ${invalid.response.status}: ${invalid.text}`);
  assert.ok(invalid.response.headers.get('content-type')?.includes('application/json') || invalid.response.status === 405,
    `${name} invalid POST did not return JSON/405`);

  if (token) {
    const unsupported = await call(name, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: '__test_unsupported_action__' }),
    });
    assert.ok(unsupported.response.status < 500, `${name} unsupported action returned ${unsupported.response.status}: ${unsupported.text}`);
  }

  console.log(`PASS ${name}: OPTIONS=${options.response.status}, GET=${get.response.status}, invalid POST=${invalid.response.status}`);
}

console.log(`Edge smoke suite passed for ${functions.length} functions.`);
