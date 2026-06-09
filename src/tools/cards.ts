import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SembleClient } from '../client.js';
import { callTool } from '../result.js';
import {
  READ_ONLY,
  WRITE,
  WRITE_IDEMPOTENT,
  DESTRUCTIVE,
} from '../annotations.js';
import {
  formatCard,
  formatCollection,
  formatPagination,
  formatUrlMetadata,
  formatUrlView,
  formatUser,
  type CardLike,
  type CollectionLike,
  type PaginationLike,
  type UrlMetadataLike,
  type UrlViewLike,
  type UserLike,
} from '../format.js';

const urlTypeSchema = z
  .enum([
    'article',
    'link',
    'book',
    'research',
    'audio',
    'video',
    'social',
    'event',
    'software',
  ])
  .describe('Filter by URL content type');

const pageSchema = z.number().int().min(1).optional().describe('Page number');
const limitSchema = z
  .number()
  .int()
  .min(1)
  .max(100)
  .optional()
  .describe('Results per page');

export function registerCardTools(
  server: McpServer,
  client: SembleClient,
  authenticated: boolean,
) {
  // Public tools — work without an API key.
  server.registerTool(
    'search_urls',
    {
      annotations: { title: 'Search URLs', ...READ_ONLY },
      description:
        'Full-text search URLs across all of Semble by title, description, or URL. ' +
        'Searches everyone’s saved cards, not just your library.',
      inputSchema: {
        searchQuery: z.string().describe('Search terms'),
        urlType: urlTypeSchema.optional(),
        page: pageSchema,
        limit: limitSchema,
      },
    },
    async ({ searchQuery, urlType, page, limit }) =>
      callTool<{ urls: UrlViewLike[]; pagination: PaginationLike }>(
        () =>
          client.cards.searchCards({
            query: { searchQuery, urlType, page, limit },
          }),
        (body) => ({
          urls: body.urls.map(formatUrlView),
          pagination: formatPagination(body.pagination),
        }),
      ),
  );

  server.registerTool(
    'semantic_search',
    {
      annotations: { title: 'Semantic search URLs', ...READ_ONLY },
      description:
        'Natural-language semantic (vector) search across URLs on Semble. ' +
        'Use for conceptual queries; use search_urls for exact terms. ' +
        'Optionally scope to one user via identifier (handle or DID).',
      inputSchema: {
        query: z.string().describe('Natural-language search query'),
        urlType: urlTypeSchema.optional(),
        identifier: z
          .string()
          .optional()
          .describe('Limit results to this user (handle or DID)'),
        limit: limitSchema,
      },
    },
    async ({ query, urlType, identifier, limit }) =>
      callTool<{ urls: UrlViewLike[]; pagination: PaginationLike }>(
        () =>
          client.search.semantic({
            query: { query, urlType, identifier, limit },
          }),
        (body) => ({
          urls: body.urls.map(formatUrlView),
          pagination: formatPagination(body.pagination),
        }),
      ),
  );

  server.registerTool(
    'get_user_cards',
    {
      annotations: { title: "Get a user's cards", ...READ_ONLY },
      description:
        "List the cards in another user's Semble library, paginated. " +
        'Identify the user by handle or DID (from get_user_profile or search results).',
      inputSchema: {
        identifier: z.string().describe('User handle or DID'),
        urlType: urlTypeSchema.optional(),
        page: pageSchema,
        limit: limitSchema,
        sortBy: z
          .enum(['createdAt', 'updatedAt', 'libraryCount'])
          .optional()
          .describe('Sort field'),
        sortOrder: z.enum(['asc', 'desc']).optional(),
      },
    },
    async ({ identifier, urlType, page, limit, sortBy, sortOrder }) =>
      callTool<{ cards: CardLike[]; pagination: PaginationLike }>(
        () =>
          client.cards.cardsByUser({
            query: { identifier, urlType, page, limit, sortBy, sortOrder },
          }),
        (body) => ({
          cards: body.cards.map(formatCard),
          pagination: formatPagination(body.pagination),
        }),
      ),
  );

  server.registerTool(
    'get_similar_urls',
    {
      annotations: { title: 'Find similar URLs', ...READ_ONLY },
      description:
        'Find URLs on Semble semantically similar to a given URL ("more like this"). ' +
        'Use semantic_search instead when starting from a text query.',
      inputSchema: {
        url: z.string().describe('The URL to find similar content for'),
        urlType: urlTypeSchema.optional(),
        threshold: z
          .number()
          .min(0)
          .max(1)
          .optional()
          .describe('Minimum similarity score (0–1)'),
        limit: limitSchema,
        page: pageSchema,
      },
    },
    async ({ url, urlType, threshold, limit, page }) =>
      callTool<{ urls: UrlViewLike[]; pagination: PaginationLike }>(
        () =>
          client.search.similarUrls({
            query: { url, urlType, threshold, limit, page },
          }),
        (body) => ({
          urls: body.urls.map(formatUrlView),
          pagination: formatPagination(body.pagination),
        }),
      ),
  );

  server.registerTool(
    'get_card',
    {
      annotations: { title: 'Get a card', ...READ_ONLY },
      description:
        'Get a single Semble card by ID, including its note, collections, ' +
        'and which users have it in their library.',
      inputSchema: {
        cardId: z.string().describe('The card ID'),
      },
    },
    async ({ cardId }) =>
      callTool<CardLike & { libraries?: { handle: string }[] }>(
        () => client.cards.cardById({ query: { cardId } }),
        (body) => ({
          ...formatCard(body),
          savedByUsers: body.libraries?.map((u) => u.handle),
        }),
      ),
  );

  server.registerTool(
    'get_url_metadata',
    {
      annotations: { title: 'Get URL metadata', ...READ_ONLY },
      description:
        'Fetch metadata (title, description, site, author, type) for any URL ' +
        'without saving it. Use to preview a link before add_url_to_library, ' +
        'or to resolve what a bare URL points to. Set includeStats for ' +
        'aggregate library/note/collection/connection counts on Semble.',
      inputSchema: {
        url: z.string().describe('The URL to fetch metadata for'),
        includeStats: z
          .boolean()
          .optional()
          .describe('Include aggregate Semble stats for this URL'),
      },
    },
    async ({ url, includeStats }) =>
      callTool<{ metadata: UrlMetadataLike; stats?: unknown }>(
        () => client.cards.urlMetadata({ query: { url, includeStats } }),
        (body) => ({
          metadata: formatUrlMetadata(body.metadata),
          stats: body.stats,
        }),
      ),
  );

  server.registerTool(
    'get_url_libraries',
    {
      annotations: { title: 'List savers of a URL', ...READ_ONLY },
      description:
        'List the users who have saved a given URL to their library, with each ' +
        "saver's note and when they saved it. Shows who finds a link valuable.",
      inputSchema: {
        url: z.string().describe('The URL to look up'),
        page: pageSchema,
        limit: limitSchema,
      },
    },
    async ({ url, page, limit }) =>
      callTool<{
        libraries: { user: UserLike; card: CardLike }[];
        pagination: PaginationLike;
      }>(
        () => client.cards.librariesForUrl({ query: { url, page, limit } }),
        (body) => ({
          libraries: body.libraries.map((entry) => ({
            user: entry.user.handle,
            savedAt: entry.card.createdAt,
            note: entry.card.note?.text,
          })),
          pagination: formatPagination(body.pagination),
        }),
      ),
  );

  server.registerTool(
    'get_url_notes',
    {
      annotations: { title: 'List notes on a URL', ...READ_ONLY },
      description:
        'List the notes people have written about a given URL across Semble.',
      inputSchema: {
        url: z.string().describe('The URL to look up'),
        page: pageSchema,
        limit: limitSchema,
      },
    },
    async ({ url, page, limit }) =>
      callTool<{
        notes: {
          id: string;
          note: string;
          author: UserLike;
          createdAt: string;
        }[];
        pagination: PaginationLike;
      }>(
        () => client.cards.noteCardsForUrl({ query: { url, page, limit } }),
        (body) => ({
          notes: body.notes.map((n) => ({
            id: n.id,
            note: n.note,
            author: n.author.handle,
            createdAt: n.createdAt,
          })),
          pagination: formatPagination(body.pagination),
        }),
      ),
  );

  server.registerTool(
    'get_card_libraries',
    {
      annotations: { title: 'List savers of a card', ...READ_ONLY },
      description:
        'List the users who have a specific card (by card ID) in their library, ' +
        'with the total count.',
      inputSchema: {
        cardId: z.string().describe('The card ID'),
      },
    },
    async ({ cardId }) =>
      callTool<{ users: UserLike[]; totalCount: number }>(
        () => client.cards.cardLibraries({ query: { cardId } }),
        (body) => ({
          users: body.users.map(formatUser),
          totalCount: body.totalCount,
        }),
      ),
  );

  // Authenticated tools — require SEMBLE_API_KEY.
  if (!authenticated) return;

  server.registerTool(
    'update_note_card',
    {
      annotations: { title: 'Update a note card', ...WRITE_IDEMPOTENT },
      description:
        'Update the text of an existing note card by its card ID. The cardId here ' +
        'is the NOTE card’s ID (e.g. from a card’s note.id), not the URL card. ' +
        'To attach a note to a URL card instead, use update_card_collections.',
      inputSchema: {
        cardId: z.string().describe('The note card ID to update'),
        note: z.string().describe('The new note text'),
      },
    },
    async ({ cardId, note }) =>
      callTool(() => client.cards.cardNote({ body: { cardId, note } })),
  );

  server.registerTool(
    'add_url_to_library',
    {
      annotations: { title: 'Save a URL to library', ...WRITE },
      description:
        'Save a URL to the Semble library as a card, optionally with a note ' +
        'and/or filed into collections. Returns the new card ID.',
      inputSchema: {
        url: z.string().describe('The URL to save'),
        note: z.string().optional().describe('A note to attach to the card'),
        collectionIds: z
          .array(z.string())
          .optional()
          .describe('Collection IDs to file the card into'),
      },
    },
    async ({ url, note, collectionIds }) =>
      callTool(() =>
        client.cards.addUrlToLibrary({ body: { url, note, collectionIds } }),
      ),
  );

  server.registerTool(
    'list_my_cards',
    {
      annotations: { title: 'List my cards', ...READ_ONLY },
      description:
        'List the cards saved in your Semble library, paginated. ' +
        'Set uncollected to true to see cards not yet filed into any collection.',
      inputSchema: {
        urlType: urlTypeSchema.optional(),
        uncollected: z
          .boolean()
          .optional()
          .describe('Only cards not in any collection'),
        page: pageSchema,
        limit: limitSchema,
        sortBy: z
          .enum(['createdAt', 'updatedAt', 'libraryCount'])
          .optional()
          .describe('Sort field'),
        sortOrder: z.enum(['asc', 'desc']).optional(),
      },
    },
    async ({ urlType, uncollected, page, limit, sortBy, sortOrder }) =>
      callTool<{ cards: CardLike[]; pagination: PaginationLike }>(
        () =>
          client.cards.myUrlCards({
            query: { urlType, uncollected, page, limit, sortBy, sortOrder },
          }),
        (body) => ({
          cards: body.cards.map(formatCard),
          pagination: formatPagination(body.pagination),
        }),
      ),
  );

  server.registerTool(
    'get_url_status',
    {
      annotations: { title: 'Check if a URL is saved', ...READ_ONLY },
      description:
        'Check whether a URL is already saved in your Semble library. ' +
        'If saved, returns the existing card and its collections — use this ' +
        'before add_url_to_library to avoid duplicates or to find the card ID for a URL.',
      inputSchema: {
        url: z.string().describe('The URL to check'),
      },
    },
    async ({ url }) =>
      callTool<{ card?: CardLike; collections?: CollectionLike[] }>(
        () => client.cards.urlLibraryStatus({ query: { url } }),
        (body) => ({
          inLibrary: Boolean(body.card),
          card: body.card ? formatCard(body.card) : undefined,
          collections: body.collections?.map(formatCollection),
        }),
      ),
  );

  server.registerTool(
    'remove_card_from_library',
    {
      annotations: { title: 'Remove a card from library', ...DESTRUCTIVE },
      description:
        'Remove a card from your Semble library (also removes it from your collections).',
      inputSchema: {
        cardId: z.string().describe('The card ID to remove'),
      },
    },
    async ({ cardId }) =>
      callTool(() => client.cards.removeFromLibrary({ body: { cardId } })),
  );
}
