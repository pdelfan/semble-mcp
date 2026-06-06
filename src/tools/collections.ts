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
    'search_collections',
    {
      description:
        'Search collections across all of Semble by name, paginated. ' +
        'Optionally filter to one user (identifier) or by access type.',
      inputSchema: {
        searchText: z.string().optional().describe('Search terms'),
        identifier: z
          .string()
          .optional()
          .describe('Limit results to collections owned by this user (handle or DID)'),
        accessType: z
          .enum(['OPEN', 'CLOSED'])
          .optional()
          .describe('Filter by access type'),
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
    async ({ searchText, identifier, accessType, page, limit }) =>
      callTool<{ collections: CollectionLike[]; pagination: PaginationLike }>(
        () =>
          client.collections.searchCollections({
            query: { searchText, identifier, accessType, page, limit },
          }),
        (body) => ({
          collections: body.collections.map(formatCollection),
          pagination: formatPagination(body.pagination),
        }),
      ),
  );

  server.registerTool(
    'get_user_collections',
    {
      description:
        "List another user's Semble collections, paginated. " +
        'Identify the user by handle or DID. Optionally filter by name with searchText.',
      inputSchema: {
        identifier: z.string().describe('User handle or DID'),
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
    async ({ identifier, searchText, page, limit }) =>
      callTool<{ collections: CollectionLike[]; pagination: PaginationLike }>(
        () =>
          client.collections.collectionsByUser({
            query: { identifier, searchText, page, limit },
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
    'update_collection',
    {
      description:
        "Update a collection's name, description, or access type. " +
        'name is required by the API — pass the current name to keep it unchanged.',
      inputSchema: {
        collectionId: z.string().describe('The collection ID'),
        name: z
          .string()
          .describe('Collection name (pass the current name to keep it)'),
        description: z.string().optional().describe('Collection description'),
        accessType: z
          .enum(['OPEN', 'CLOSED'])
          .optional()
          .describe('Who can contribute'),
      },
    },
    async ({ collectionId, name, description, accessType }) =>
      callTool(() =>
        client.collections.updateCollection({
          body: { collectionId, name, description, accessType },
        }),
      ),
  );

  server.registerTool(
    'delete_collection',
    {
      description:
        'Permanently delete a collection you own. Cards filed in it stay in ' +
        'your library; only the collection itself is removed. This cannot be undone.',
      inputSchema: {
        collectionId: z.string().describe('The collection ID to delete'),
      },
    },
    async ({ collectionId }) =>
      callTool(() =>
        client.collections.deleteCollection({ body: { collectionId } }),
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
