import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

delete process.env.METRC_VENDOR_API_KEY;
delete process.env.METRC_USER_API_KEY;
delete process.env.MCP_API_KEY;
const { createApp } = await import('../../serve.js');

let server, base;
before(async () => {
  server = createServer(createApp());
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const rpc = (body) => fetch(`${base}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('health', async () => {
  const r = await fetch(`${base}/health`);
  assert.equal(r.status, 200);
});

test('tools/list works without credentials', async () => {
  const r = await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.ok(Array.isArray(j.result.tools) && j.result.tools.length > 0);
});

test('tools/call without credentials returns a readable error', async () => {
  const list = await (await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' })).json();
  const name = list.result.tools[0].name;
  const r = await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name, arguments: {} } });
  const text = JSON.stringify(await r.json());
  assert.match(text, /METRC_VENDOR_API_KEY/);
});

test('no CORS header by default', async () => {
  const r = await fetch(`${base}/mcp`, { method: 'OPTIONS', headers: { origin: 'https://evil.test' } });
  assert.equal(r.headers.get('access-control-allow-origin'), null);
});

test('serves the chat page', async () => {
  const r = await fetch(`${base}/chat`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /text\/html/);
});

test('unknown paths are 404', async () => {
  assert.equal((await fetch(`${base}/nope`, { method: 'POST' })).status, 404);
});

test('path traversal is 404', async () => {
  assert.equal((await fetch(`${base}/..%2f..%2fpackage.json`)).status, 404);
  assert.equal((await fetch(`${base}/%2e%2e/serve.js`)).status, 404);
});

test('request body over 1 MB is rejected with 413', async () => {
  const big = 'x'.repeat(1_048_576 + 1024);
  const r = await fetch(`${base}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: big });
  assert.equal(r.status, 413);
  assert.deepEqual(await r.json(), { error: 'Payload too large' });
});

test('text/plain POST to /mcp is rejected with 415 and not executed', async () => {
  const r = await fetch(`${base}/mcp`, {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
  });
  assert.equal(r.status, 415);
  assert.deepEqual(await r.json(), { error: 'Content-Type must be application/json' });
});

test('text/plain POST to /api/chat is rejected with 415', async () => {
  const r = await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{"message":"hi"}' });
  assert.equal(r.status, 415);
});

test('application/json with charset is accepted', async () => {
  const r = await fetch(`${base}/mcp`, {
    method: 'POST',
    headers: { 'content-type': 'Application/JSON; charset=utf-8' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
  });
  assert.equal(r.status, 200);
  assert.ok((await r.json()).result.tools.length > 0);
});

test('/api/chat without OpenRouter config returns 503', async () => {
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_KEY_URL;
  const r = await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: 'hi' }) });
  assert.equal(r.status, 503);
  assert.deepEqual(await r.json(), { error: 'OPENROUTER_API_KEY or OPENROUTER_KEY_URL is required' });
});
