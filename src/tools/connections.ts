import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SembleClient } from '../client.js';
import { callTool } from '../result.js';
import { READ_ONLY, WRITE, WRITE_IDEMPOTENT, DESTRUCTIVE } from '../annotations.js';
import {
  formatConnection,
  formatPagination,
  type ConnectionLike,
  type PaginationLike,
} from '../format.js';

const connectionTypeSchema = z
  .enum([
    'SUPPORTS',
    'OPPOSES',
    'ADDRESSES',
    'HELPFUL',
    'LEADS_TO',
    'RELATED',
    'SUPPLEMENT',
    'EXPLAINER',
  ])
  .describe('The kind of relationship from source to target');

const pageSchema = z.number().int().min(1).optional().describe('Page number');
const limitSchema = z
  .number()
  .int()
  .min(1)
  .max(100)
  .optional()
  .describe('Results per page');

type ConnectionsBody = {
  connections: ConnectionLike[];
  pagination: PaginationLike;
};

const shapeConnections = (body: ConnectionsBody) => ({
  connections: body.connections.map(formatConnection),
  pagination: formatPagination(body.pagination),
});

/**
 * A "connection" is a typed, directional link a curator draws between two URLs
 * or cards (e.g. one essay SUPPORTS another, a paper ADDRESSES a question) —
 * Semble's knowledge-graph layer on top of saved links.
 */
export function registerConnectionTools(
  server: McpServer,
  client: SembleClient,
  authenticated: boolean,
) {
  // Public tools — work without an API key.
  server.registerTool(
    'get_user_connections',
    {
      annotations: { title: "Get a user's connections", ...READ_ONLY },
      description:
        'List the connections a user has drawn between URLs/cards, by handle or DID. ' +
        'Connections are typed, directional links (SUPPORTS, OPPOSES, LEADS_TO, …).',
      inputSchema: {
        identifier: z.string().describe('User handle or DID'),
        connectionTypes: z
          .array(connectionTypeSchema)
          .optional()
          .describe('Only return connections of these types'),
        page: pageSchema,
        limit: limitSchema,
      },
    },
    async ({ identifier, connectionTypes, page, limit }) =>
      callTool<ConnectionsBody>(
        () =>
          client.connections.connectionsByUser({
            query: { identifier, connectionTypes, page, limit },
          }),
        shapeConnections,
      ),
  );

  server.registerTool(
    'get_url_connections',
    {
      annotations: { title: 'Get connections for a URL', ...READ_ONLY },
      description:
        'List the connections involving a given URL — what it links to and what ' +
        'links to it. Use direction to filter: forward = this URL is the source, ' +
        'backward = this URL is the target, both = either end.',
      inputSchema: {
        url: z.string().describe('The URL to find connections for'),
        direction: z
          .enum(['forward', 'backward', 'both'])
          .optional()
          .describe('Which end of the connection this URL should be on'),
        connectionTypes: z
          .array(connectionTypeSchema)
          .optional()
          .describe('Only return connections of these types'),
        page: pageSchema,
        limit: limitSchema,
      },
    },
    async ({ url, direction, connectionTypes, page, limit }) =>
      callTool<ConnectionsBody>(
        () =>
          client.connections.connectionsForUrl({
            query: { url, direction, connectionTypes, page, limit },
          }),
        shapeConnections,
      ),
  );

  // Authenticated tools — require SEMBLE_API_KEY.
  if (!authenticated) return;

  server.registerTool(
    'create_connection',
    {
      annotations: { title: 'Create a connection', ...WRITE },
      description:
        'Create a typed, directional link from a source to a target. Each side is ' +
        'either a URL or a card ID. Example: connect essay A as SUPPORTS essay B. ' +
        'Optionally label it with a connectionType and a note.',
      inputSchema: {
        sourceType: z
          .enum(['URL', 'CARD'])
          .describe('Whether the source is a raw URL or a card ID'),
        sourceValue: z.string().describe('The source URL or card ID'),
        targetType: z
          .enum(['URL', 'CARD'])
          .describe('Whether the target is a raw URL or a card ID'),
        targetValue: z.string().describe('The target URL or card ID'),
        connectionType: connectionTypeSchema.optional(),
        note: z.string().optional().describe('An optional note on the link'),
      },
    },
    async ({
      sourceType,
      sourceValue,
      targetType,
      targetValue,
      connectionType,
      note,
    }) =>
      callTool(() =>
        client.connections.createConnection({
          body: {
            sourceType,
            sourceValue,
            targetType,
            targetValue,
            connectionType,
            note,
          },
        }),
      ),
  );

  server.registerTool(
    'update_connection',
    {
      annotations: { title: 'Update a connection', ...WRITE_IDEMPOTENT },
      description:
        "Update one of your connections: change its type or note, clear the note " +
        '(removeNote), or swap its source and target direction (swap).',
      inputSchema: {
        connectionId: z.string().describe('The connection ID to update'),
        connectionType: connectionTypeSchema.optional(),
        note: z.string().optional().describe('Replace the note text'),
        removeNote: z
          .boolean()
          .optional()
          .describe('Clear the existing note'),
        swap: z
          .boolean()
          .optional()
          .describe('Swap source and target (reverse the direction)'),
      },
    },
    async ({ connectionId, connectionType, note, removeNote, swap }) =>
      callTool(() =>
        client.connections.updateConnection({
          body: { connectionId, connectionType, note, removeNote, swap },
        }),
      ),
  );

  server.registerTool(
    'delete_connection',
    {
      annotations: { title: 'Delete a connection', ...DESTRUCTIVE },
      description: 'Permanently delete one of your connections by ID.',
      inputSchema: {
        connectionId: z.string().describe('The connection ID to delete'),
      },
    },
    async ({ connectionId }) =>
      callTool(() =>
        client.connections.deleteConnection({ body: { connectionId } }),
      ),
  );
}
