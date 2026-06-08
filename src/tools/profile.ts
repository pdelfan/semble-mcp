import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SembleClient } from '../client.js';
import { callTool } from '../result.js';
import {
  formatCollection,
  formatPagination,
  formatProfileView,
  formatUser,
  type CollectionLike,
  type PaginationLike,
  type ProfileViewLike,
  type UserLike,
} from '../format.js';

const pageSchema = z.number().int().min(1).optional().describe('Page number');
const limitSchema = z
  .number()
  .int()
  .min(1)
  .max(100)
  .optional()
  .describe('Results per page');

export function registerProfileTools(
  server: McpServer,
  client: SembleClient,
  authenticated: boolean,
) {
  // Public tools — work without an API key.
  server.registerTool(
    'get_user_profile',
    {
      description:
        'Get a public Semble user profile by handle (e.g. "alice.bsky.social") or DID.',
      inputSchema: {
        identifier: z.string().describe('User handle or DID'),
        includeStats: z
          .boolean()
          .optional()
          .describe('Include follower, card, and collection counts'),
      },
    },
    async ({ identifier, includeStats }) =>
      callTool<UserLike>(
        () => client.users.userProfile({ query: { identifier, includeStats } }),
        formatUser,
      ),
  );

  server.registerTool(
    'search_people',
    {
      description:
        'Search for people (AT Protocol / Bluesky accounts) by handle or display name. ' +
        'Returns handles and DIDs you can pass to get_user_profile, get_user_cards, ' +
        'or follow_target. This is how you find a user when you only know their name.',
      inputSchema: {
        query: z.string().describe('Name or handle to search for'),
        limit: limitSchema,
        cursor: z
          .string()
          .optional()
          .describe('Pagination cursor from a previous response'),
      },
    },
    async ({ query, limit, cursor }) =>
      callTool<{ actors: ProfileViewLike[]; cursor?: string }>(
        () =>
          client.search.atProtoAccounts({ query: { q: query, limit, cursor } }),
        (body) => ({
          accounts: body.actors.map(formatProfileView),
          nextCursor: body.cursor,
        }),
      ),
  );

  server.registerTool(
    'get_following_users',
    {
      description:
        'List the users that a given user follows, by handle or DID.',
      inputSchema: {
        identifier: z.string().describe('User handle or DID'),
        page: pageSchema,
        limit: limitSchema,
      },
    },
    async ({ identifier, page, limit }) =>
      callTool<{ users: UserLike[]; pagination: PaginationLike }>(
        () =>
          client.users.followingUsers({ query: { identifier, page, limit } }),
        (body) => ({
          users: body.users.map(formatUser),
          pagination: formatPagination(body.pagination),
        }),
      ),
  );

  server.registerTool(
    'get_user_followers',
    {
      description: 'List the users who follow a given user, by handle or DID.',
      inputSchema: {
        identifier: z.string().describe('User handle or DID'),
        page: pageSchema,
        limit: limitSchema,
      },
    },
    async ({ identifier, page, limit }) =>
      callTool<{ users: UserLike[]; pagination: PaginationLike }>(
        () =>
          client.users.userFollowers({ query: { identifier, page, limit } }),
        (body) => ({
          users: body.users.map(formatUser),
          pagination: formatPagination(body.pagination),
        }),
      ),
  );

  server.registerTool(
    'get_following_collections',
    {
      description:
        'List the collections that a given user follows, by handle or DID.',
      inputSchema: {
        identifier: z.string().describe('User handle or DID'),
        page: pageSchema,
        limit: limitSchema,
      },
    },
    async ({ identifier, page, limit }) =>
      callTool<{ collections: CollectionLike[]; pagination: PaginationLike }>(
        () =>
          client.users.followingCollections({
            query: { identifier, page, limit },
          }),
        (body) => ({
          collections: body.collections.map(formatCollection),
          pagination: formatPagination(body.pagination),
        }),
      ),
  );

  server.registerTool(
    'get_follow_counts',
    {
      description:
        'Get a user’s follow counts in one call: how many users they follow, ' +
        'how many followers they have, and how many collections they follow. ' +
        'By handle or DID. (get_user_profile with includeStats also returns these.)',
      inputSchema: {
        identifier: z.string().describe('User handle or DID'),
      },
    },
    async ({ identifier }) =>
      callTool<{
        following: number;
        followers: number;
        followingCollections: number;
      }>(async () => {
        const [following, followers, collections] = await Promise.all([
          client.users.followingCount({ query: { identifier } }),
          client.users.userFollowersCount({ query: { identifier } }),
          client.users.followingCollectionsCount({ query: { identifier } }),
        ]);
        const bad = [following, followers, collections].find(
          (r) => !(r.status >= 200 && r.status < 300),
        );
        if (bad) return bad;
        return {
          status: 200,
          body: {
            following: (following.body as { count: number }).count,
            followers: (followers.body as { count: number }).count,
            followingCollections: (collections.body as { count: number }).count,
          },
        };
      }),
  );

  // Authenticated tools — require SEMBLE_API_KEY.
  if (!authenticated) return;

  server.registerTool(
    'get_my_profile',
    {
      description:
        'Get the authenticated Semble user profile (handle, name, bio). ' +
        'Set includeStats for follower/following/card/collection counts.',
      inputSchema: {
        includeStats: z
          .boolean()
          .optional()
          .describe('Include follower, card, and collection counts'),
      },
    },
    async ({ includeStats }) =>
      callTool<UserLike>(
        () => client.users.myProfile({ query: { includeStats } }),
        formatUser,
      ),
  );

  server.registerTool(
    'follow_target',
    {
      description:
        'Follow a user or a collection as the authenticated user. ' +
        'For a user, targetId is their DID (get it from search_people or ' +
        'get_user_profile); for a collection, targetId is the collection ID.',
      inputSchema: {
        targetId: z
          .string()
          .describe('A user DID, or a collection ID, to follow'),
        targetType: z
          .enum(['USER', 'COLLECTION'])
          .describe('Whether the target is a user or a collection'),
      },
    },
    async ({ targetId, targetType }) =>
      callTool(() =>
        client.users.followTarget({ body: { targetId, targetType } }),
      ),
  );

  server.registerTool(
    'unfollow_target',
    {
      description:
        'Stop following a user or collection you currently follow. ' +
        'targetId is the user DID or the collection ID.',
      inputSchema: {
        targetId: z
          .string()
          .describe('A user DID, or a collection ID, to unfollow'),
        targetType: z
          .enum(['USER', 'COLLECTION'])
          .describe('Whether the target is a user or a collection'),
      },
    },
    async ({ targetId, targetType }) =>
      callTool(() =>
        client.users.unfollowTarget({ body: { targetId, targetType } }),
      ),
  );
}
