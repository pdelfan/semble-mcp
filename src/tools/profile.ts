import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SembleClient } from '../client.js';
import { callTool } from '../result.js';
import { formatUser, type UserLike } from '../format.js';

export function registerProfileTools(server: McpServer, client: SembleClient) {
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
}
