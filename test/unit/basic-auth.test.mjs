import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeBasicAuth } from '../../lib/basic-auth.js';

test('encodes vendor:user as a Basic header', () => {
  assert.equal(encodeBasicAuth('vendor', 'user'), 'Basic ' + Buffer.from('vendor:user').toString('base64'));
});

test('handles keys with url-safe characters', () => {
  const v = 'abc-DEF_123', u = 'xyz-UVW_789';
  assert.equal(encodeBasicAuth(v, u), 'Basic ' + Buffer.from(`${v}:${u}`).toString('base64'));
});
