# dndbeyond-mcp

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

## Installation

```bash
npx dndbeyond-mcp
```

Or install globally:

```bash
npm install -g dndbeyond-mcp
```

From a local checkout:

```bash
npm install
npm run build
```

## Setup

Authenticate with D&D Beyond from a terminal you control:

```bash
npx dndbeyond-mcp setup
```

This opens a browser window. Log in normally. The session cookie is saved to `~/.dndbeyond-mcp/config.json`. Do not share that file.

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
      "args": ["-y", "dndbeyond-mcp"],
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
      "args": ["-y", "dndbeyond-mcp"],
      "env": {
        "DDB_MCP_MODE": "session"
      }
    }
  }
}
```

From a local build, point `command` at `node` and `args` at `build/src/index.js`.

Restart the client after changing the config.

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

## License

MIT. See [LICENSE](LICENSE).
