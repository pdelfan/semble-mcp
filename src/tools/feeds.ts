import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SembleClient } from '../client.js';
import { callTool } from '../result.js';
import {
  formatFeedItem,
  formatPagination,
  type FeedItemLike,
  type PaginationLike,
} from '../format.js';

const feedInputSchema = {
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
    .describe('Filter by URL content type'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe('Number of activities to return'),
  beforeActivityId: z
    .string()
    .optional()
    .describe('Return activities older than this activity ID (for paging)'),
};

type FeedBody = { activities: FeedItemLike[]; pagination: PaginationLike };

const shapeFeed = (body: FeedBody) => ({
  activities: body.activities.map(formatFeedItem),
  pagination: formatPagination(body.pagination),
});

export function registerFeedTools(server: McpServer, client: SembleClient) {
  server.registerTool(
    'get_global_feed',
    {
      description:
        'Get recent public activity across all Semble users (cards saved, connections made).',
      inputSchema: feedInputSchema,
    },
    async ({ urlType, limit, beforeActivityId }) =>
      callTool<FeedBody>(
        () =>
          client.feeds.globalFeed({
            query: { urlType, limit, beforeActivityId },
          }),
        shapeFeed,
      ),
  );

  server.registerTool(
    'get_following_feed',
    {
      description:
        'Get recent activity from the users and collections you follow on Semble.',
      inputSchema: feedInputSchema,
    },
    async ({ urlType, limit, beforeActivityId }) =>
      callTool<FeedBody>(
        () =>
          client.feeds.followingFeed({
            query: { urlType, limit, beforeActivityId },
          }),
        shapeFeed,
      ),
  );
}
