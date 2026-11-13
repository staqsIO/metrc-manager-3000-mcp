# METRC MCP Server

An MCP (Model Context Protocol) server that exposes the METRC cannabis tracking API to LLMs. It provides 71 tools covering facilities, strains, items, locations, plants and plant batches, harvests, packages, lab tests, transfers, sales, processing, waste and sandbox setup (read and write), plus the analysis playbooks in `skills/` as MCP resources (`metrc://skills/<name>`).

It runs two ways: over stdio for desktop MCP clients, or as a small HTTP service (Docker) with a chat demo and a sandbox browser.

## Claude Desktop (stdio)

```bash
git clone git@github.com:staqsIO/metrc-manager-3000-mcp.git && cd metrc-manager-3000-mcp && npm ci
```

Add to your Claude Desktop (or Cursor) MCP config:

```json
{
  "mcpServers": {
    "metrc": {
      "command": "node",
      "args": ["/absolute/path/to/metrc-manager-3000-mcp/server.js"],
      "env": {
        "METRC_API_URL": "https://sandbox-api-co.metrc.com",
        "METRC_VENDOR_API_KEY": "<vendor key>",
        "METRC_USER_API_KEY": "<user key>"
      }
    }
  }
}
```

Restart the client after pulling new tools.

### Skills as resources

Any MCP client can call `resources/list` (URIs such as `metrc://skills/needs-attention`) and `resources/read` to load a skill's markdown, then follow it using the METRC tools. See `skills/README.md` for the full list.

## HTTP (Docker / compose)

```bash
docker build -t metrc-mcp . && docker run -p 8080:8080 --env-file .env metrc-mcp
```

Without Docker: `npm ci && npm run serve`.

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Liveness check |
| `POST /mcp` (also `/` and `/api/mcp`) | MCP JSON-RPC over HTTP: `tools/list`, `tools/call` |
| `POST /api/chat` | Chat via OpenRouter with METRC tools. Body: `{ "message": "List my facilities" }` or `{ "messages": [...] }` |
| `GET /chat` | Chat demo page |
| `GET /sandbox` | Sandbox browser demo page |

```bash
curl -X POST http://localhost:8080/mcp -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"metrc_get_facilities","arguments":{}}}'
```

Request bodies are capped at 1 MB (413 beyond that).

### Environment

| Variable | Purpose |
|----------|---------|
| `METRC_API_URL` | METRC API base URL (default `https://sandbox-api-co.metrc.com`) |
| `METRC_VENDOR_API_KEY`, `METRC_USER_API_KEY` | METRC credentials for tools |
| `METRC_VENDOR_API_KEY_CO`, `METRC_USER_API_KEY_CO`, `METRC_VENDOR_API_KEY_MA`, `METRC_USER_API_KEY_MA` | Per-state sandbox keys used by the seed scripts |
| `PORT` | HTTP port (default `8080`) |
| `MCP_API_KEY` | Optional bearer token required for `/mcp` and `/api/chat` |
| `ALLOWED_ORIGINS` | Comma-separated origins allowed for browser clients; empty means same-origin only |
| `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | Chat demo model access (model default `openai/gpt-4o`) |
| `OPENROUTER_KEY_URL`, `OPENROUTER_KEY_TOKEN` | Optional key service and its bearer token, used instead of `OPENROUTER_API_KEY` |

The bundled `/chat` and `/sandbox` demo pages do not send `MCP_API_KEY`. Leave `MCP_API_KEY` unset when using them, or front them with your own authentication.

This server is part of the METRC Manager 3000 stack: from that repository, `docker compose --profile mcp up` starts it alongside the other services.

## Known limitation

The HTTP endpoint implements the `tools/list` and `tools/call` JSON-RPC methods only, not the full MCP Streamable HTTP handshake (`initialize`). Use stdio mode for MCP clients that require the handshake.

## Sandbox seeding

Seed a METRC sandbox with demo data (set the per-state keys in `.env`, see `.env.example`):

```bash
npm run seed:co   # Colorado: METRC_VENDOR_API_KEY_CO / METRC_USER_API_KEY_CO (or the unsuffixed keys)
npm run seed:ma   # Massachusetts: METRC_VENDOR_API_KEY_MA / METRC_USER_API_KEY_MA
```

Details and sandbox limits are in `docs/sandbox-seeding.md` and `docs/sandbox-limitations.md`.

## Development

```bash
npm ci
npm run test:unit   # fast unit tests, no credentials needed
npm test            # integration test; needs sandbox keys in .env
```

Further reference lives in `docs/` (tools, skills, framework, sandbox view).

## Contributors

Created by [Staqs](https://github.com/staqsIO), [Waev Tech](https://github.com/waevtech) and [UMB Advisors](https://github.com/UMB-Advisors). See the [root repository](https://github.com/staqsIO/metrc-manager-3000#contributors) for details.

## License

MIT, see [LICENSE](LICENSE).
