# Semble MCP Server

Give your AI assistant access to [Semble](https://semble.so) — the social library for the web, where people save, annotate, and connect the links worth keeping.

This is a [Model Context Protocol](https://modelcontextprotocol.io) server. Once it's connected, you can just *talk* to your assistant (Claude Desktop, Claude Code, Cursor, …) about your Semble library and the wider network — no commands to memorize:

> *"Save this article to my Semble library and file it under **AI Safety**, with a note about why it matters."*
>
> *"Search Semble for essays about attention and focus, then show me the three most-saved ones."*
>
> *"What's `alice.bsky.social` been reading lately?"*

Behind the scenes the assistant picks from 46 tools; you stay in plain English.

## Install

This server isn't on npm yet, so you run it from the repo. You'll need [Node.js](https://nodejs.org) 18.18 or newer (`node --version` to check).

Once you have the repository on your machine (clone it, or download the ZIP and unzip), open a terminal **in the project folder** and build it:

```sh
cd semble-mcp     # the folder you downloaded

npm install       # install dependencies
npm run build     # compile to dist/index.js
```

That produces `dist/index.js` — the server your AI client will run. **Note its absolute path**, you'll need it in a moment:

```sh
# prints something like /Users/you/semble-mcp/dist/index.js
echo "$(pwd)/dist/index.js"
```

> Already have a Semble API key, or want one? Create it at [semble.so/settings/api-keys](https://semble.so/settings/api-keys) — you'll only see it once, so copy it somewhere safe. A key is **optional**; without it the server runs read-only (see [below](#no-key-try-it-anonymously)).

## Connect it to your client

Point your client at the built `dist/index.js` using its absolute path from above. Replace `/absolute/path/to/semble-mcp` and `your_api_key` throughout.

### Claude Desktop

Open **Settings → Developer → Edit Config**, and add Semble under `mcpServers`:

```json
{
  "mcpServers": {
    "semble": {
      "command": "node",
      "args": ["/absolute/path/to/semble-mcp/dist/index.js"],
      "env": { "SEMBLE_API_KEY": "your_api_key" }
    }
  }
}
```

Save the file, then fully **quit and reopen** Claude Desktop — Semble's tools appear.

### Claude Code

```sh
claude mcp add semble -e SEMBLE_API_KEY=your_api_key -- node /absolute/path/to/semble-mcp/dist/index.js
```

### Cursor

Add the same block as Claude Desktop to `.cursor/mcp.json`.

> **Once `@semble.so/mcp` is published to npm**, you'll be able to skip the clone and build entirely — set `"command": "npx"` with `"args": ["-y", "@semble.so/mcp"]` (or `npx -y @semble.so/mcp` for Claude Code) and that's it.

### No key? Try it anonymously

You don't need an account to look around. **Leave `SEMBLE_API_KEY` out** and the server starts in **anonymous mode** — search, public profiles and collections, the global feed, and connections all work read-only. Anything that touches *your* library (saving, organizing, follows, notifications) simply isn't offered until you add a key, so the assistant won't try to use it.

## What you can do

A taste of the kinds of things you can ask for, by theme:

**📥 Save & organize**
- "Add this URL to my library with a note."
- "Make a collection called *Weekend reads* and put these three links in it."
- "Is this article already in my library?"
- "Move that card out of *Inbox* and into *Design*."

**🔎 Search & discover**
- "Find links about distributed systems on Semble." *(keyword)*
- "Show me writing that feels like *the experience of getting lost in a city*." *(meaning-based)*
- "More things like this blog post." *(similar URLs)*
- "What's the most-saved link about LLM evals?"

**🌍 Explore people & collections**
- "Find Semble users called *Jacky*."
- "What's in `omg.jacky.wtf`'s library?"
- "Who follows this collection, and who's been adding to it?"
- "Preview what this URL is before I open it."

**🔗 Connect ideas** *(Semble's knowledge-graph layer)*
- "Connect this paper as **SUPPORTS** that one."
- "What does this URL link to — and what links back to it?"

**🔔 Stay current**
- "Anything new in my Semble notifications?"
- "Show me what the people I follow have been saving."

## A few concepts worth knowing

The server tells the assistant these up front, but they help you phrase requests too:

- **Cards** are saved links. The same URL can be saved by many people; each save is its own card with its own note and collections.
- **Collections** are named groups of cards (public **OPEN** or private **CLOSED**).
- **People** are identified by a Bluesky/AT Protocol **handle** (like `alice.bsky.social`) or a **DID**. Either works — and "find someone by name" is just `search_people` under the hood.
- **Connections** are typed, directional links you draw between two links (one essay *SUPPORTS* another, a paper *ADDRESSES* a question) — a graph on top of your bookmarks.

## Tool reference

You never need to name these — the assistant chooses them — but here's the full set. Tools marked 🔑 need an API key and are hidden in anonymous mode.

<details>
<summary><strong>Cards</strong> — saving, searching, and inspecting links</summary>

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
| `get_url_libraries` | List users who have saved a given URL, with their notes |
| `get_url_notes` | List notes people have written about a given URL |
| `get_card_libraries` | List the users who have a given card in their library |
| `update_note_card` 🔑 | Update the text of an existing note card |
| `remove_card_from_library` 🔑 | Remove a card from your library |

</details>

<details>
<summary><strong>Collections</strong> — grouping and curating cards</summary>

| Tool | Description |
| --- | --- |
| `create_collection` 🔑 | Create a collection (OPEN or CLOSED) |
| `list_my_collections` 🔑 | List your collections |
| `search_collections` | Search collections across Semble by name |
| `get_user_collections` | List another user's collections by handle or DID |
| `get_collection` | Get a collection and its cards |
| `get_collection_by_at_uri` | Get a collection by owner handle + record key (AT URI parts) |
| `get_url_collections` | List collections across Semble that contain a given URL |
| `get_collection_followers` | List a collection's followers and total follower count |
| `get_collection_contributors` | List users who have added cards to a collection |
| `get_user_contributed_collections` | OPEN collections a user has contributed cards to |
| `update_collection` 🔑 | Rename a collection or change its description/access type |
| `delete_collection` 🔑 | Permanently delete a collection you own |
| `update_card_collections` 🔑 | File a card into / remove it from collections, update its note |

</details>

<details>
<summary><strong>People & following</strong> — profiles and the social graph</summary>

| Tool | Description |
| --- | --- |
| `get_my_profile` 🔑 | Your profile, optionally with stats |
| `get_user_profile` | A public profile by handle or DID |
| `search_people` | Find AT Protocol / Bluesky accounts by handle or display name |
| `get_following_users` | Users a given user follows |
| `get_user_followers` | Users who follow a given user |
| `get_following_collections` | Collections a given user follows |
| `get_follow_counts` | A user's following / followers / followed-collections counts |
| `follow_target` 🔑 | Follow a user (DID) or collection (ID) |
| `unfollow_target` 🔑 | Unfollow a user or collection |

</details>

<details>
<summary><strong>Connections</strong> — typed links between ideas</summary>

A connection is a typed, directional link between two URLs/cards (e.g. one essay `SUPPORTS` another).

| Tool | Description |
| --- | --- |
| `get_user_connections` | Connections a user has drawn, by handle or DID |
| `get_url_connections` | Connections into/out of a given URL |
| `create_connection` 🔑 | Link a source URL/card to a target with a type and note |
| `update_connection` 🔑 | Change a connection's type/note, or swap its direction |
| `delete_connection` 🔑 | Delete a connection you own |

</details>

<details>
<summary><strong>Feeds & notifications</strong> — what's happening</summary>

| Tool | Description |
| --- | --- |
| `get_global_feed` | Recent activity across Semble |
| `get_following_feed` 🔑 | Activity from users/collections you follow |
| `get_my_notifications` 🔑 | Your notifications and unread count |
| `get_unread_count` 🔑 | Just your unread notification count (cheap check) |
| `mark_notifications_read` 🔑 | Mark specific notifications (or all) as read |

</details>

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `SEMBLE_API_KEY` | no | Semble API key (`sk_...`); without it only public read-only tools are available |
| `SEMBLE_BASE_URL` | no | Override the API base URL (default `https://api.semble.so/xrpc`) |

## Troubleshooting

- **The tools don't show up.** Restart the client completely (Claude Desktop needs a full quit + reopen, not just closing the window).
- **Only some tools appear.** That's anonymous mode — the `SEMBLE_API_KEY` isn't being picked up. Double-check it's set in the config above and starts with `sk_`.
- **"API key missing or invalid" errors.** The key may be expired or revoked; generate a fresh one at [semble.so/settings/api-keys](https://semble.so/settings/api-keys).

Your key lives only in your local MCP client config and is sent straight to Semble — it isn't logged or shared.

## Development

```sh
npm install
npm run build       # bundle to dist/ with tsup
npm test            # unit tests
npm run typecheck   # tsc --noEmit
npm run inspect     # open MCP Inspector against the built server
```

The server speaks stdio; all diagnostics go to stderr. It also sends MCP `instructions` — a short primer on Semble's domain model (cards, collections, connections, the handle/DID scheme, when to use keyword vs. semantic vs. similar search) so clients use the tools well without repeating it in every description. Built on the official [`@semble.so/api`](https://www.npmjs.com/package/@semble.so/api) client.

## Links

- [Semble](https://semble.so) · [API docs](https://docs.cosmik.network/semble-api) · [Model Context Protocol](https://modelcontextprotocol.io)
