#!/usr/bin/env node
/** HTTP entrypoint: MCP JSON-RPC at / and /mcp, chat API at /api/chat, demo pages at /chat and /sandbox. */
import 'dotenv/config';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import mcpHandler from './api/mcp.js';
import chatHandler from './api/chat.js';
import { readPublic } from './lib/static.js';

const PAGES = { '/chat': 'chat.html', '/sandbox': 'sandbox.html' };

const MAX_BODY_BYTES = 1_048_576;

class PayloadTooLargeError extends Error {}

async function toWebRequest(req, port) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > MAX_BODY_BYTES) throw new PayloadTooLargeError('Payload too large');
    chunks.push(c);
  }
  const body = Buffer.concat(chunks);
  return new Request(new URL(req.url || '/', `http://localhost:${port}`), {
    method: req.method,
    headers: Object.fromEntries(Object.entries(req.headers).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])),
    body: req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined,
  });
}

async function sendWeb(res, webRes) {
  res.writeHead(webRes.status, Object.fromEntries(webRes.headers.entries()));
  res.end(Buffer.from(await webRes.arrayBuffer()));
}

export function createApp() {
  return async (req, res) => {
    const started = Date.now();
    const path = (req.url || '/').split('?')[0];
    const port = req.socket.localPort;
    try {
      if (req.method === 'GET' && (path === '/' || path === '/health')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', service: 'metrc-formul8-os-mcp' }));
      } else if ((req.method === 'POST' || req.method === 'OPTIONS') && (path === '/' || path === '/mcp' || path === '/api/mcp')) {
        await sendWeb(res, await mcpHandler(await toWebRequest(req, port)));
      } else if ((req.method === 'POST' || req.method === 'OPTIONS') && path === '/api/chat') {
        await sendWeb(res, await chatHandler(await toWebRequest(req, port)));
      } else if (req.method === 'GET') {
        const file = await readPublic(PAGES[path] ?? path);
        if (!file) { res.writeHead(404); res.end('Not found'); }
        else { res.writeHead(200, { 'Content-Type': file.type }); res.end(file.body); }
      } else {
        res.writeHead(404); res.end('Not found');
      }
    } catch (err) {
      if (err instanceof PayloadTooLargeError) {
        // Stop reading the rest of the upload and close the connection after responding.
        res.writeHead(413, { 'Content-Type': 'application/json', Connection: 'close' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy?.();
        console.log(`${req.method} ${path} → 413 (${Date.now() - started}ms)`);
        return;
      }
      console.error(`${req.method} ${path} failed:`, err instanceof Error ? err.message : err);
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal error' }));
    }
    console.log(`${req.method} ${path} → ${res.statusCode} (${Date.now() - started}ms)`);
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PORT = parseInt(process.env.PORT || '8080', 10);
  const server = createServer(createApp());
  server.requestTimeout = 30_000;
  server.headersTimeout = 10_000;
  server.listen(PORT, () => console.log(`metrc-formul8-os-mcp listening on :${PORT}`));
}
