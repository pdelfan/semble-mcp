import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SembleClient } from '../client.js';
import { callTool } from '../result.js';
import {
  formatCard,
  formatCollection,
  formatPagination,
  formatUser,
  type CardLike,
  type CollectionLike,
  type PaginationLike,
  type UserLike,
} from '../format.js';

export function registerCollectionTools(
  server: McpServer,
  client: SembleClient,
  authenticated: boolean,
) {
  // Public tools — work without an API key.
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
    'get_url_collections',
    {
      description:
        'List the collections across Semble that contain a given URL.',
      inputSchema: {
        url: z.string().describe('The URL to look up'),
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
    async ({ url, page, limit }) =>
      callTool<{ collections: CollectionLike[]; pagination: PaginationLike }>(
        () =>
          client.collections.collectionsForUrl({ query: { url, page, limit } }),
        (body) => ({
          collections: body.collections.map(formatCollection),
          pagination: formatPagination(body.pagination),
        }),
      ),
  );

  server.registerTool(
    'get_collection_by_at_uri',
    {
      description:
        'Get a collection and its cards by AT Protocol coordinates — the owner ' +
        "handle and the record key (the parts of an AT URI " +
        '"at://<handle>/network.cosmik.collection/<recordKey>"). ' +
        'Use get_collection when you have the collection ID instead.',
      inputSchema: {
        handle: z.string().describe('The owning user’s handle'),
        recordKey: z.string().describe('The collection record key (rkey)'),
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
    async ({ handle, recordKey, page, limit }) =>
      callTool<
        CollectionLike & { urlCards: CardLike[]; pagination: PaginationLike }
      >(
        () =>
          client.collections.collectionByAtUri({
            query: { handle, recordKey, page, limit },
          }),
        (body) => ({
          ...formatCollection(body),
          cards: body.urlCards.map(formatCard),
          pagination: formatPagination(body.pagination),
        }),
      ),
  );

  server.registerTool(
    'get_collection_followers',
    {
      description:
        'List the users who follow a collection, plus the total follower count.',
      inputSchema: {
        collectionId: z.string().describe('The collection ID'),
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
    async ({ collectionId, page, limit }) =>
      callTool<{
        followerCount: number;
        followers: ReturnType<typeof formatUser>[];
        pagination: ReturnType<typeof formatPagination>;
      }>(async () => {
        const [list, count] = await Promise.all([
          client.collections.collectionFollowers({
            query: { collectionId, page, limit },
          }),
          client.collections.collectionFollowersCount({
            query: { collectionId },
          }),
        ]);
        const bad = [list, count].find(
          (r) => !(r.status >= 200 && r.status < 300),
        );
        if (bad) return bad;
        const listBody = list.body as { users: UserLike[]; pagination: PaginationLike };
        const countBody = count.body as { count: number };
        return {
          status: 200,
          body: {
            followerCount: countBody.count,
            followers: listBody.users.map(formatUser),
            pagination: formatPagination(listBody.pagination),
          },
        };
      }),
  );

  server.registerTool(
    'get_collection_contributors',
    {
      description:
        'List the users who have added cards to a collection (its contributors).',
      inputSchema: {
        collectionId: z.string().describe('The collection ID'),
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
    async ({ collectionId, page, limit }) =>
      callTool<{ users: UserLike[]; pagination: PaginationLike }>(
        () =>
          client.collections.collectionContributors({
            query: { collectionId, page, limit },
          }),
        (body) => ({
          contributors: body.users.map(formatUser),
          pagination: formatPagination(body.pagination),
        }),
      ),
  );

  server.registerTool(
    'get_user_contributed_collections',
    {
      description:
        'List the OPEN collections that a given user has contributed cards to ' +
        '(but does not necessarily own), by handle or DID.',
      inputSchema: {
        identifier: z.string().describe('User handle or DID'),
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
    async ({ identifier, page, limit }) =>
      callTool<{ collections: CollectionLike[]; pagination: PaginationLike }>(
        () =>
          client.collections.openWithContributor({
            query: { identifier, page, limit },
          }),
        (body) => ({
          collections: body.collections.map(formatCollection),
          pagination: formatPagination(body.pagination),
        }),
      ),
  );

  // Authenticated tools — require SEMBLE_API_KEY.
  if (!authenticated) return;

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
