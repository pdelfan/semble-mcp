import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SembleClient } from '../client.js';
import { callTool } from '../result.js';
import {
  formatCard,
  formatPagination,
  formatUrlView,
  type CardLike,
  type PaginationLike,
  type UrlViewLike,
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

export function registerCardTools(server: McpServer, client: SembleClient) {
  server.registerTool(
    'add_url_to_library',
    {
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
    'search_my_cards',
    {
      description:
        'Full-text search the cards saved in your Semble library by title/URL.',
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
      description:
        'Natural-language semantic (vector) search across URLs on Semble. ' +
        'Use for conceptual queries; use search_my_cards for exact terms. ' +
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
    'list_my_cards',
    {
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
    'get_card',
    {
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
    'remove_card_from_library',
    {
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
