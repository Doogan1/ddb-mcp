# ddb-mcp

A TypeScript [MCP](https://modelcontextprotocol.io/) server for D&D Beyond. It gives MCP-compatible clients access to your D&D Beyond characters, campaigns, and reference lookups.

> **Disclaimer:** This project uses unofficial, reverse-engineered D&D Beyond endpoints. It is not affiliated with, endorsed by, or supported by D&D Beyond or Wizards of the Coast. Endpoints may change without notice. Using it may violate D&D Beyond's terms of service.

## Attribution

This project is based on [dndbeyond-mcp](https://github.com/AlexWorland/dndbeyond-mcp) by [Alex Worland](https://github.com/AlexWorland). The original README stated that work was MIT-licensed.

This repository continues that MCP server. It does **not** include personal vault-export or third-party stat-block backfill scripts from the original tree. Write tools are opt-in so an agent cannot mutate or delete characters unless you enable that mode.

## Features

- **Character reads** — Character sheets by ID or name
- **Campaign access** — List campaigns and party rosters
- **Reference lookups** — Spells, monsters, items, feats, conditions, classes, races, backgrounds
- **Optional session writes** — HP, spell slots, rests, conditions, currency (off by default)
- **Optional builder tools** — Create/update/delete characters (off by default; delete requires confirmation)
- **Browser-based auth** — Playwright login flow; run it yourself, not through the agent

## Prerequisites

- **Node.js 20+** and npm
- **git**
- **Google Chrome** — the login flow launches real Chrome (not Playwright's bundled Chromium), so it needs to already be installed:
  - Debian/Ubuntu: download the `.deb` from [google.com/chrome](https://www.google.com/chrome/) or add Google's apt repo
  - Fedora: `sudo dnf install google-chrome-stable` (after enabling Google's repo, or via the RPM from their site)
  - macOS: `brew install --cask google-chrome`
  - Windows: `winget install Google.Chrome`

If you're being walked through this by an AI coding agent, see [CLAUDE.md](CLAUDE.md) — it has the exact command sequence for a fresh setup.

## Installation

```bash
npx ddb-mcp
```

Or install globally:

```bash
npm install -g ddb-mcp
```

From a local checkout:

```bash
git clone https://github.com/Doogan1/ddb-mcp.git
cd ddb-mcp
npm install
npx playwright install chromium
npm run build
```

## Setup

Authenticate with D&D Beyond from a terminal you control — this step is interactive and opens a real, visible browser window, so it can't be run through an agent's sandboxed shell or a headless server:

```bash
npx ddb-mcp setup
```

Log in normally in the browser window that opens. The session cookie is saved to `~/.dndbeyond-mcp/config.json`. Do not share that file — see [Securing your credentials](#securing-your-credentials) below.

Once connected to an MCP client, verify the session with the `check_auth` tool.

### Securing your credentials

`~/.dndbeyond-mcp/config.json` holds your D&D Beyond session cookie — anyone with read access to it has access to your D&D Beyond account. The directory isn't created with restrictive permissions by default, so lock it down after your first `npm run setup`:

```bash
chmod 700 ~/.dndbeyond-mcp
chmod 600 ~/.dndbeyond-mcp/config.json
```

## Tool access modes

Write tools are **not** registered unless you set `DDB_MCP_MODE`. Default is `read`.

| Mode | What the agent can do |
|------|------------------------|
| `read` (default) | Auth check, character/campaign reads, reference lookups |
| `session` | Everything in `read`, plus combat/session updates (HP, slots, rests, conditions, currency) |
| `builder` | Everything in `session`, plus character creation, builder edits, and delete |

`delete_character` also requires `confirm: true` and the exact character name.

## Claude Desktop / Cursor configuration

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Read-only (recommended default):

```json
{
  "mcpServers": {
    "dndbeyond": {
      "command": "npx",
      "args": ["-y", "ddb-mcp"],
      "env": {
        "DDB_MCP_MODE": "read"
      }
    }
  }
}
```

Session play (HP, spell slots, rests):

```json
{
  "mcpServers": {
    "dndbeyond": {
      "command": "npx",
      "args": ["-y", "ddb-mcp"],
      "env": {
        "DDB_MCP_MODE": "session"
      }
    }
  }
}
```

From a local build, point `command` at `node` and `args` at `build/src/index.js`.

Restart the client after changing the config.

## Claude Code configuration

From a local checkout, register the server with the [Claude Code CLI](https://code.claude.com/docs/en/mcp) instead of hand-editing a JSON file:

```bash
claude mcp add ddb-mcp -s user -e DDB_MCP_MODE=read -- node /absolute/path/to/ddb-mcp/build/src/index.js
```

- `-s user` registers it for every project, not just the current directory. Use `-s local` (the default) to scope it to one project instead.
- `-e DDB_MCP_MODE=session` (or `builder`) instead of `read` to enable write tools, same modes as above.
- The path after `--` must be absolute and point at your own local build — `node build/src/index.js` alone only works if Claude Code's working directory happens to be this repo.

Verify it's connected:

```bash
claude mcp list
claude mcp get ddb-mcp
```

If this repo's own `.mcp.json` still points at someone else's absolute path (e.g. from cloning a fork), either fix that path to your own, or remove/ignore it if you're using `-s user` registration instead — a stale project-scoped entry and a user-scoped entry pointing at different paths will conflict.

## Tools

### Always available (`read`)

- `check_auth` — Verify the saved session
- `get_character` / `list_characters` / `get_definition`
- `list_campaigns` / `get_campaign_characters`
- `search_spells` / `get_spell`
- `search_monsters` / `get_monster`
- `search_items` / `get_item`
- `search_feats` / `get_condition` / `search_classes`
- `search_races` / `search_backgrounds` / `search_class_features` / `search_racial_traits`

Login is a CLI command (`npm run setup`), not an agent tool.

### Session mode

- `update_hp` / `set_inspiration` / `add_condition` / `remove_condition`
- `update_spell_slots` / `update_pact_magic` / `cast_spell`
- `update_death_saves` / `update_currency` / `use_ability`
- `long_rest` / `short_rest`

### Builder mode

- `create_character` / `delete_character`
- Class, species, background, ability scores, inventory, description, and choice tools

## Resources

| URI | Description |
|-----|-------------|
| `dndbeyond://characters` | Your character list |
| `dndbeyond://character/{id}` | Character sheet |
| `dndbeyond://character/{id}/spells` | Spell list |
| `dndbeyond://character/{id}/inventory` | Inventory |
| `dndbeyond://campaigns` | Your campaigns |
| `dndbeyond://campaign/{id}/party` | Party roster |

## Prompts

| Prompt | Purpose |
|--------|---------|
| `character-summary` | Full character rundown |
| `session-prep` | DM session preparation |
| `encounter-builder` | Balanced encounter design |
| `spell-advisor` | Spell recommendations |
| `level-up-guide` | Level-up walkthrough |
| `rules-lookup` | Rules clarification |

## Security

This server stores your D&D Beyond session cookie locally at `~/.dndbeyond-mcp/config.json`. That cookie provides access to your D&D Beyond account. Never share it. The server only communicates with `dndbeyond.com` domains.

D&D Beyond may restrict unofficial clients. Prefer `read` mode. Do not bulk-export catalogs you do not own. Monster lookups honor D&D Beyond `accessType` flags; unowned stat blocks stay stubbed.

## Troubleshooting

**`sudo: a terminal is required to read the password`** — if an AI agent is helping you install prerequisites, it can't supply your `sudo` password interactively. Run the install command yourself in your own terminal, then let the agent continue.

**Playwright complains it can't find a browser** — the bundled Chromium download is separate from `npm install`. Run:

```bash
npx playwright install chromium
```

**The login browser window won't open, or `npm run setup` hangs** — the login flow launches a real, visible browser window (`headless: false`), so it needs an actual display. It won't work over a plain SSH session without X forwarding, inside most containers, or through an agent's sandboxed shell. Run it directly in a terminal on a machine with a screen.

**`npm run setup` fails immediately with a browser launch error** — confirm real Google Chrome is installed (`google-chrome --version` or `google-chrome-stable --version`), not just Playwright's Chromium; see [Prerequisites](#prerequisites).

**Claude Code shows the server as disconnected, or tools from a stale path** — check for a conflict between this repo's own `.mcp.json` (project scope) and a `-s user` registration; see the note at the end of [Claude Code configuration](#claude-code-configuration).

## License

MIT. See [LICENSE](LICENSE).
