# ddb-mcp

This file provides guidance when working with code in this repository.

## Setting this up for a new user

If a user asks you to help them get their own instance of this server running (e.g. a party member who cloned this repo), follow this sequence rather than improvising — it's the exact path that was validated end-to-end on a fresh machine.

1. **Check prerequisites**: `git --version`, `node --version` (need ≥20), `npm --version`. If any are missing, identify the user's OS/package manager and give them the exact install command — **do not run `sudo` yourself**; it requires an interactive password prompt you can't supply. Tell the user to run it in their own terminal and let you know when it's done.
2. **Install and build**: `npm install`, `npm run build`.
3. **Playwright browser**: `npx playwright install chromium`.
4. **Real Chrome**: `setup/auth-flow.ts` launches with `channel: "chrome"`, which requires actual Google Chrome, not just Playwright's bundled Chromium. Check with `google-chrome --version` or `google-chrome-stable --version`; if missing, this also needs `sudo` — same rule as step 1, hand it to the user.
5. **Run `npm run setup`**: this opens a real, visible browser window on the user's machine. Tell them what to expect (log in normally, the window closes itself once auth succeeds) and then wait — do not attempt to script or intercept this step; it's designed to be interactive and keep the user's credentials off any process you control.
6. **Lock down credentials**: `chmod 700 ~/.dndbeyond-mcp && chmod 600 ~/.dndbeyond-mcp/config.json`. The directory isn't created with restrictive permissions by default.
7. **Register with their MCP client.** For Claude Code: `claude mcp add ddb-mcp -s user -- node <absolute-path-to-repo>/build/src/index.js` (use `-e DDB_MCP_MODE=session` etc. if they want write tools). Check whether this repo's own `.mcp.json` has a stale absolute path from a previous clone — if so, either fix it to the user's actual path or note that it may conflict with a `-s user` registration.
8. **Verify**: `claude mcp list` should show it connected; a `check_auth` tool call should confirm the session is valid.

See [README.md](README.md) for the full user-facing version of this, including per-OS prerequisite install commands and a troubleshooting section.

## Build & Test Commands

```bash
npm run build          # TypeScript compilation (tsc)
npm run dev            # Watch mode (tsc --watch)
npm test               # Run all tests (vitest)
npm run test:watch     # Vitest watch mode
npx vitest tests/tools/character.test.ts  # Run a single test file
npx vitest -t "should format"            # Run tests matching name pattern
npm run setup          # Browser-based auth flow (Playwright)
```

## Architecture

MCP server exposing D&D Beyond data through tools, resources, and prompts. ES module TypeScript project targeting ES2022/Node16.

### Request Flow

```
MCP Client → StdioServerTransport → McpServer (src/server.ts)
  → Tool handler (src/tools/*.ts)
    → DdbClient (src/api/client.ts)
      → TtlCache → RateLimiter (2 req/s) → CircuitBreaker → withRetry → fetch
        → D&D Beyond APIs
```

### Tool access modes

`DDB_MCP_MODE` controls which tools are registered. Default is `read`.

| Mode | Tools |
|------|--------|
| `read` | Auth check, character/campaign reads, reference lookups |
| `session` | `read` plus HP, slots, rests, conditions, currency |
| `builder` | `session` plus create/update/delete character |

`delete_character` also requires `confirm: true` and the exact character name. Login is `npm run setup`, not an MCP tool.

### Three API Hosts

| Host | Auth | Envelope | Client Method |
|------|------|----------|---------------|
| `character-service.dndbeyond.com` | Bearer token | `{ success, data }` | `client.get()` |
| `monster-service.dndbeyond.com` | Bearer token | `{ accessType, pagination, data }` | `client.getRaw()` |
| `www.dndbeyond.com` | Cookie + Bearer | `{ status: "success", data }` | `client.get()` |

`client.get()` auto-unwraps envelopes. `client.getRaw()` returns raw JSON (used for monster-service's custom format).

### Key Directories

- `src/api/` — Auth (cobalt token exchange, cookie storage), HTTP client, endpoint URL builders
- `src/config/` — Tool access mode parsing
- `src/tools/` — MCP tool implementations: `character.ts` (read+write), `campaign.ts`, `reference.ts`, `auth.ts`
- `src/resilience/` — Circuit breaker, rate limiter, exponential retry
- `src/cache/` — TTL cache with LRU eviction
- `src/types/` — API response types, character model, reference params
- `src/prompts/` — Six workflow prompts (session-prep, encounter-builder, etc.)
- `src/resources/` — MCP resource templates for character/campaign data
- `setup/` — Playwright browser auth flow

### Auth Flow

Credentials stored at `~/.dndbeyond-mcp/config.json`. Cobalt token obtained by POSTing cookies to `auth-service.dndbeyond.com/v1/cobalt-token`, cached in memory with 30s buffer before TTL. Header construction in `DdbClient.buildHeaders()` selects cookie+bearer vs bearer-only based on URL host.

## Testing Patterns

- **Framework:** Vitest 3.0 with globals enabled
- **Mock auth:** Mock `getCobaltToken` and `getAllCookies` (not `getCobaltSession`)
- **Mock client:** Supply `{ get, getRaw }` — `get()` returns unwrapped data (not the envelope)
- **Mock fetch:** `global.fetch = vi.fn()` with `{ ok: true, json: () => Promise.resolve(data) }`
- **Timer tests:** `vi.useFakeTimers()` + `vi.runAllTimersAsync()` for retry/delay paths
- **Character mocks:** Must include `modifiers` and `actions` fields

## Conventions

- All tool handlers return `{ content: [{ type: "text", text: string }] }`
- Endpoints defined as URL builder functions in `src/api/endpoints.ts`
- Cache keys follow `entity:id` pattern (e.g., `character:123`, `spell-compendium:class:1`)
- Character lookup supports fuzzy name matching (not just numeric ID)
- Ability scores use IDs 1-6 mapping to STR, DEX, CON, INT, WIS, CHA
- `client.put()` auto-invalidates specified cache keys on success
- Spell lookups use `always-known-spells` across casting class IDs; honor D&D Beyond access flags and do not bulk-export unowned content
