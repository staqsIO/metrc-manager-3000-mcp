/**
 * MCP-over-HTTP handler for METRC tools (plain Node handler: Web Request in, Response out; mounted by serve.js).
 * POST with JSON-RPC body: { method: "tools/list" } or { method: "tools/call", params: { name, arguments } }.
 */

import { getToolsList, executeTool } from '../lib/metrc-edge.js';

import { parseOrigins, corsHeaders, checkBearer } from '../lib/http-security.js';

const ALLOWED_ORIGINS = parseOrigins(process.env.ALLOWED_ORIGINS);
const getCorsHeaders = (req) => corsHeaders(req?.headers?.get?.('origin') || '', ALLOWED_ORIGINS);

export default async function handler(req) {
  const jsonResponse = (body, status = 200, headers = {}) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(req), ...headers },
    });
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  if (!checkBearer(req.headers.get('authorization'), process.env.MCP_API_KEY)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  if (!/^application\/json/i.test(req.headers.get('content-type') || '')) {
    return jsonResponse({ error: 'Content-Type must be application/json' }, 415);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400);
  }

  const { jsonrpc, id, method, params } = body;
  const startMs = Date.now();

  if (method === 'tools/list') {
    const tools = getToolsList();
    console.log(`[MCP] tools/list → ${tools.length} tools (${Date.now() - startMs}ms)`);
    return jsonResponse({ jsonrpc: jsonrpc || '2.0', id: id ?? 1, result: { tools } });
  }

  if (method === 'tools/call') {
    const name = params?.name;
    const args = params?.arguments ?? {};
    if (!name) {
      console.log(`[MCP] tools/call → ERROR missing tool name`);
      return jsonResponse({ jsonrpc: jsonrpc || '2.0', id: id ?? 1, error: { code: -32602, message: 'Missing tool name' } }, 400);
    }
    try {
      const text = await executeTool(name, args);
      const resultLen = typeof text === 'string' ? text.length : 0;
      console.log(`[MCP] tools/call ${name} → OK ${resultLen} chars (${Date.now() - startMs}ms)`);
      return jsonResponse({
        jsonrpc: jsonrpc || '2.0',
        id: id ?? 1,
        result: { content: [{ type: 'text', text }] },
      });
    } catch (err) {
      console.error(`[MCP] tools/call ${name} → ERROR (${Date.now() - startMs}ms)`);
      return jsonResponse({
        jsonrpc: jsonrpc || '2.0',
        id: id ?? 1,
        result: {
          content: [{ type: 'text', text: `Error: ${err.message}` }],
          isError: true,
        },
      });
    }
  }

  console.log(`[MCP] unknown method: ${method}`);
  return jsonResponse({ jsonrpc: jsonrpc || '2.0', id: id ?? 1, error: { code: -32601, message: `Method not found: ${method}` } }, 404);
}
