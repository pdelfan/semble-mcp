# Semble MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) server for the [Semble API](https://docs.cosmik.network/semble-api). Lets MCP clients (Claude Desktop, Claude Code, Cursor, and others) save URLs to your Semble library, search your cards, manage collections, and browse feeds.

## Setup

1. Create a Semble API key at [semble.so/settings/api-keys](https://semble.so/settings/api-keys) — save it; you won't be able to view it again.
2. Add the server to your MCP client with the key in the `SEMBLE_API_KEY` environment variable.

Without an API key the server runs in **anonymous mode**: only the public read-only tools (search, public profiles, public collections, the global feed) are registered, and tools that touch your library are hidden.

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

The server also sends MCP `instructions` — a short primer on Semble's domain
model (cards, collections, the handle/DID identifier scheme, when to use
keyword vs. semantic vs. similar search) — so clients can use these tools well
without it being repeated in every description.

Tools marked 🔑 require `SEMBLE_API_KEY` and are not registered in anonymous mode.

### Cards

| Tool | Description |
| --- | --- |
| `add_url_to_library` 🔑 | Save a URL to your library, optionally with a note and collections |
| `search_urls` | Full-text search URLs across all of Semble |
| `semantic_search` | Natural-language semantic search across Semble URLs |
| `get_similar_urls` | Find URLs similar to a given URL ("more like this") |
| `list_my_cards` 🔑 | List your library cards, paginated and filterable |
| `get_user_cards` | List another user's library cards by handle or DID |
| `get_url_status` 🔑 | Check if a URL is already in your library (returns the card if so) |
| `get_card` | Get a card with its note, collections, and savers |
| `get_url_metadata` | Fetch a URL's title/description/site without saving it (preview) |
| `remove_card_from_library` 🔑 | Remove a card from your library |

### Collections

| Tool | Description |
| --- | --- |
| `create_collection` 🔑 | Create a collection (OPEN or CLOSED) |
| `list_my_collections` 🔑 | List your collections |
| `search_collections` | Search collections across Semble by name |
| `get_user_collections` | List another user's collections by handle or DID |
| `get_collection` | Get a collection and its cards |
| `update_collection` 🔑 | Rename a collection or change its description/access type |
| `delete_collection` 🔑 | Permanently delete a collection you own |
| `update_card_collections` 🔑 | File a card into / remove it from collections, update its note |

### People & Following

| Tool | Description |
| --- | --- |
| `get_my_profile` 🔑 | Your profile, optionally with stats |
| `get_user_profile` | A public profile by handle or DID |
| `search_people` | Find AT Protocol / Bluesky accounts by handle or display name |
| `get_following_users` | Users a given user follows |
| `get_user_followers` | Users who follow a given user |
| `get_following_collections` | Collections a given user follows |
| `follow_target` 🔑 | Follow a user (DID) or collection (ID) |
| `unfollow_target` 🔑 | Unfollow a user or collection |

### Connections

A connection is a typed, directional link between two URLs/cards (e.g. one essay `SUPPORTS` another).

| Tool | Description |
| --- | --- |
| `get_user_connections` | Connections a user has drawn, by handle or DID |
| `get_url_connections` | Connections into/out of a given URL |
| `create_connection` 🔑 | Link a source URL/card to a target with a type and note |
| `update_connection` 🔑 | Change a connection's type/note, or swap its direction |
| `delete_connection` 🔑 | Delete a connection you own |

### Feeds & Notifications

| Tool | Description |
| --- | --- |
| `get_global_feed` | Recent activity across Semble |
| `get_following_feed` 🔑 | Activity from users/collections you follow |
| `get_my_notifications` 🔑 | Your notifications and unread count |
| `mark_notifications_read` 🔑 | Mark specific notifications (or all) as read |

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `SEMBLE_API_KEY` | no | Semble API key (`sk_...`); without it only public read-only tools are available |
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
