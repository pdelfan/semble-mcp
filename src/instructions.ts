/**
 * Conceptual primer surfaced to the client as MCP server `instructions`.
 * Gives the model a mental model of Semble's domain so it picks the right
 * tool and chains calls sensibly, instead of inferring everything from the
 * 21 individual tool descriptions.
 */

const CORE = `# Semble

Semble is a social bookmarking and collective-knowledge network built on the AT
Protocol (the protocol behind Bluesky). People save web URLs they find valuable,
annotate them, organize them, and discover what others are reading. Think of it
as a shared, searchable library of the web, curated by humans.

## Core objects

- **Card** — one person's saved URL. The same URL can be saved by many people;
  each save is a distinct card with its own note and collections. A card's
  "library count" is how many people have saved that URL — a signal of
  collective interest.
- **Collection** — a named, ordered group of cards owned by a user (e.g. "AI
  safety reading", "recipes to try"). Access is OPEN (public) or CLOSED. A card
  can live in several collections.
- **User / actor** — a person, identified by an AT Protocol **handle**
  (e.g. \`alice.bsky.social\`) or a **DID** (e.g. \`did:plc:...\`). Either works
  anywhere an \`identifier\` is asked for. Get handles/DIDs from profiles, search
  results, feed activity, or a card's savers.
- **Feed** — a reverse-chronological stream of activity (cards saved,
  connections made) across the network or across people you follow.

## Identifier model

URLs and cards are different things. A **URL** is the underlying web resource;
**saving** it creates a **card** in a library. To act on a specific saved item
you need its **card ID** (a UUID, e.g. from search/feed/get_url_status results),
not the URL. To act on a person you need their handle or DID.

## Choosing a search tool

Three discovery paths, pick by the shape of the query:
- **search_urls** — keyword / full-text. Use for exact words, names, domains,
  or quoted phrases ("find the Stripe docs link").
- **semantic_search** — meaning / concept. Use for fuzzy, conceptual, or
  natural-language intent ("essays about attention and focus"). Scope to one
  person with \`identifier\` if asked "what does X have on …".
- **get_similar_urls** — "more like this", starting from a known URL rather
  than text. Great for exploration and recommendation chains.

All three search the whole network, not just one library.

## Scope: public vs. yours

Most tools are **global/public**: searches, feeds, \`get_user_*\`, \`get_card\`,
\`get_collection\`, \`get_user_profile\`. Tools naming "my" or that mutate
(\`list_my_cards\`, \`add_url_to_library\`, \`create_collection\`, …) act on the
**authenticated user's own** library.

## Common workflows

- **Save a URL**: call \`get_url_status\` first — if the URL is already saved it
  returns the existing card (avoid duplicates / get its ID); otherwise
  \`add_url_to_library\`, optionally with a note and \`collectionIds\`.
- **Discover then drill in**: search/feed to find candidates → \`get_card\` for a
  card's note, collections, and who saved it → \`get_user_profile\` /
  \`get_user_cards\` to explore a saver → \`get_similar_urls\` to branch outward.
- **Organize**: \`update_card_collections\` files an existing card into / out of
  collections and edits its note (this is the way to (re)collect a card).

## Conventions

- Results are **paginated** (\`page\`/\`limit\`, or \`beforeActivityId\` for feeds);
  follow pagination rather than assuming the first page is everything.
- \`urlType\` filters by content kind across most tools: article, link, book,
  research, audio, video, social, event, software.
- A looked-up card/collection/profile that doesn't exist may surface as a
  server error rather than an empty result — treat "not found"-flavored errors
  as "no such item", not a transient failure.`;

const AUTHENTICATED_NOTE = `

You are connected with an API key, so both public tools and the
authenticated user's own library/collection/profile tools are available.`;

const ANONYMOUS_NOTE = `

No API key is configured, so this server is in **anonymous mode**: only public,
read-only tools are registered (search, public profiles, public collections,
\`get_card\`, and the global feed). Tools that read or modify a personal library —
saving URLs, listing "my" cards/collections, the following feed — are not
available. If the user asks to save or organize anything, explain that a Semble
API key (\`SEMBLE_API_KEY\`) is required and is currently not set.`;

export function serverInstructions(authenticated: boolean): string {
  return CORE + (authenticated ? AUTHENTICATED_NOTE : ANONYMOUS_NOTE);
}
