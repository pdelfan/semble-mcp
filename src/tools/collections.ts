import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SembleClient } from '../client.js';
import { callTool } from '../result.js';
import {
  formatCard,
  formatCollection,
  formatPagination,
  type CardLike,
  type CollectionLike,
  type PaginationLike,
} from '../format.js';

export function registerCollectionTools(
  server: McpServer,
  client: SembleClient,
) {
  server.registerTool(
    'create_collection',
    {
      description:
        'Create a new Semble collection. OPEN collections accept contributions ' +
        'from anyone; CLOSED collections are curated only by you. Returns the new collection ID.',
      inputSchema: {
        name: z.string().describe('Collection name'),
        description: z.string().optional().describe('Collection description'),
        accessType: z
          .enum(['OPEN', 'CLOSED'])
          .optional()
          .describe('Who can contribute (default CLOSED)'),
      },
    },
    async ({ name, description, accessType }) =>
      callTool(() =>
        client.collections.createCollection({
          body: { name, description, accessType },
        }),
      ),
  );

  server.registerTool(
    'list_my_collections',
    {
      description:
        'List your Semble collections, paginated. Optionally filter by name with searchText.',
      inputSchema: {
        searchText: z
          .string()
          .optional()
          .describe('Filter collections by name'),
        page: z.number().int().min(1).optional().describe('Page number'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe('Results per page'),
      },
    },
    async ({ searchText, page, limit }) =>
      callTool<{ collections: CollectionLike[]; pagination: PaginationLike }>(
        () =>
          client.collections.myCollections({
            query: { searchText, page, limit },
          }),
        (body) => ({
          collections: body.collections.map(formatCollection),
          pagination: formatPagination(body.pagination),
        }),
      ),
  );

  server.registerTool(
    'get_collection',
    {
      description:
        'Get a Semble collection and the cards in it by collection ID, paginated.',
      inputSchema: {
        collectionId: z.string().describe('The collection ID'),
        urlType: z
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
          .optional()
          .describe('Filter cards by URL content type'),
        page: z.number().int().min(1).optional().describe('Page number'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe('Cards per page'),
      },
    },
    async ({ collectionId, urlType, page, limit }) =>
      callTool<
        CollectionLike & { urlCards: CardLike[]; pagination: PaginationLike }
      >(
        () =>
          client.collections.collectionById({
            query: { collectionId, urlType, page, limit },
          }),
        (body) => ({
          ...formatCollection(body),
          cards: body.urlCards.map(formatCard),
          pagination: formatPagination(body.pagination),
        }),
      ),
  );

  server.registerTool(
    'update_card_collections',
    {
      description:
        'File an existing card into collections and/or remove it from collections; ' +
        'can also update the card note in the same call. Use card IDs from ' +
        'list_my_cards and collection IDs from list_my_collections.',
      inputSchema: {
        cardId: z.string().describe('The card ID'),
        addToCollections: z
          .array(z.string())
          .optional()
          .describe('Collection IDs to add the card to'),
        removeFromCollections: z
          .array(z.string())
          .optional()
          .describe('Collection IDs to remove the card from'),
        note: z
          .string()
          .optional()
          .describe('Replace/set the note on the card'),
      },
    },
    async ({ cardId, addToCollections, removeFromCollections, note }) =>
      callTool(() =>
        client.cards.urlCardAssociations({
          body: { cardId, addToCollections, removeFromCollections, note },
        }),
      ),
  );
}
