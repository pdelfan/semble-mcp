# Semble MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) server for the [Semble API](https://docs.cosmik.network/semble-api). Lets MCP clients (Claude Desktop, Claude Code, Cursor, and others) save URLs to your Semble library, search your cards, manage collections, and browse feeds.

## Setup

1. Create a Semble API key at [semble.so/settings/api-keys](https://semble.so/settings/api-keys) — save it; you won't be able to view it again.
2. Add the server to your MCP client with the key in the `SEMBLE_API_KEY` environment variable.

### Claude Code

```sh
claude mcp add semble -e SEMBLE_API_KEY=sk_... -- npx -y @semble.so/mcp
```

### Claude Desktop

Add to `claude_desktop_config.json` (Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "semble": {
      "command": "npx",
      "args": ["-y", "@semble.so/mcp"],
      "env": { "SEMBLE_API_KEY": "sk_..." }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "semble": {
      "command": "npx",
      "args": ["-y", "@semble.so/mcp"],
      "env": { "SEMBLE_API_KEY": "sk_..." }
    }
  }
}
```

## Tools

### Cards

| Tool | Description |
| --- | --- |
| `add_url_to_library` | Save a URL to your library, optionally with a note and collections |
| `search_my_cards` | Full-text search your saved cards |
| `semantic_search` | Natural-language semantic search across Semble URLs |
| `list_my_cards` | List your library cards, paginated and filterable |
| `get_card` | Get a card with its note, collections, and savers |
| `remove_card_from_library` | Remove a card from your library |

### Collections

| Tool | Description |
| --- | --- |
| `create_collection` | Create a collection (OPEN or CLOSED) |
| `list_my_collections` | List your collections |
| `get_collection` | Get a collection and its cards |
| `update_card_collections` | File a card into / remove it from collections, update its note |

### Profile & Feeds

| Tool | Description |
| --- | --- |
| `get_my_profile` | Your profile, optionally with stats |
| `get_user_profile` | A public profile by handle or DID |
| `get_global_feed` | Recent activity across Semble |
| `get_following_feed` | Activity from users/collections you follow |

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `SEMBLE_API_KEY` | yes | Semble API key (`sk_...`) |
| `SEMBLE_BASE_URL` | no | Override the API base URL (default `https://api.semble.so/xrpc`) |

## Development

```sh
npm install
npm run build       # bundle to dist/ with tsup
npm test            # unit tests
npm run typecheck   # tsc --noEmit
npm run inspect     # open MCP Inspector against the built server
```

The server speaks stdio; all diagnostics go to stderr. Built on the official [`@semble.so/api`](https://www.npmjs.com/package/@semble.so/api) client.
