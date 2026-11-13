---
title: Getting started
layout: default
---

# Getting started

## 1. Install

```bash
git clone git@github.com:staqsIO/metrc-manager-3000-mcp.git
cd metrc-manager-3000-mcp
npm ci
```

## 2. Credentials

Create a `.env` file in the repo root (see `.env.example`):

```
METRC_API_URL=https://sandbox-api-co.metrc.com
METRC_VENDOR_API_KEY=your-vendor-key
METRC_USER_API_KEY=your-user-key
```

For production, point `METRC_API_URL` to the appropriate state METRC API and use production keys.

## 3a. Claude Desktop / Cursor (stdio)

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

## 3b. HTTP (Docker)

```bash
docker build -t metrc-mcp .
docker run -p 8080:8080 --env-file .env metrc-mcp
```

Endpoints: `GET /health`, `POST /mcp` (also `/api/mcp`), `POST /api/chat`, `GET /chat`, `GET /sandbox`. The HTTP endpoint supports `tools/list` and `tools/call` only; use stdio for clients that need the `initialize` handshake.

## 4. Use tools and skills

- **Tools:** In any MCP client, call tools by name (e.g. `metrc_get_facilities`, `metrc_get_packages`). See [Tools](tools).
- **Skills:** In Cursor with this repo open, ask “What needs attention?”, “Summarize the facility”, “Audit in a week — check risk areas”, “What to pull for samples?” — the rules route to the right skill. See [Skills](skills).
- **External LLMs:** Call `resources/list` and `resources/read` with URIs like `metrc://skills/needs-attention` to load skill text into context, then call the METRC tools as described in the skill.

## 5. Test

```bash
npm run test:unit   # unit tests
npm test            # integration test
```

`npm test` runs an integration test (initialize, list tools, call a few tools). Requires no credentials for structure checks; with valid `.env`, API calls are exercised.
