import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOrigins, corsHeaders, checkBearer } from '../../lib/http-security.js';

test('no allowed origins → no CORS headers', () => {
  assert.deepEqual(corsHeaders('https://evil.test', parseOrigins(undefined)), {});
  assert.deepEqual(corsHeaders('https://evil.test', parseOrigins('')), {});
});

test('echoes an allowed origin only', () => {
  const allowed = parseOrigins(' https://a.test , https://b.test ');
  assert.equal(corsHeaders('https://b.test', allowed)['Access-Control-Allow-Origin'], 'https://b.test');
  assert.deepEqual(corsHeaders('https://c.test', allowed), {});
});

test('bearer check', () => {
  assert.equal(checkBearer(null, undefined), true);
  assert.equal(checkBearer('Bearer secret-token', 'secret-token'), true);
  assert.equal(checkBearer('Bearer wrong-token!', 'secret-token'), false);
  assert.equal(checkBearer('Bearer short', 'secret-token'), false);
  assert.equal(checkBearer(null, 'secret-token'), false);
  assert.equal(checkBearer('Basic secret-token', 'secret-token'), false);
});
