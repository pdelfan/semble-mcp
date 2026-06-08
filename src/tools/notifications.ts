import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SembleClient } from '../client.js';
import { callTool } from '../result.js';
import {
  formatNotification,
  formatPagination,
  type NotificationLike,
  type PaginationLike,
} from '../format.js';

/**
 * Notifications are personal to the authenticated user, so the whole namespace
 * is gated behind an API key — nothing is registered in anonymous mode.
 */
export function registerNotificationTools(
  server: McpServer,
  client: SembleClient,
  authenticated: boolean,
) {
  if (!authenticated) return;

  server.registerTool(
    'get_my_notifications',
    {
      description:
        'List the authenticated user’s notifications (someone saved your card, ' +
        'followed you, connected your URL, …), with the current unread count.',
      inputSchema: {
        unreadOnly: z
          .boolean()
          .optional()
          .describe('Only return unread notifications'),
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
    async ({ unreadOnly, page, limit }) =>
      callTool<{
        notifications: NotificationLike[];
        unreadCount: number;
        pagination: PaginationLike;
      }>(
        () =>
          client.notifications.myNotifications({
            query: { unreadOnly, page, limit },
          }),
        (body) => ({
          notifications: body.notifications.map(formatNotification),
          unreadCount: body.unreadCount,
          pagination: formatPagination(body.pagination),
        }),
      ),
  );

  server.registerTool(
    'get_unread_count',
    {
      description:
        'Get just the number of unread notifications for the authenticated user ' +
        '— a cheap check that avoids fetching the full notification list.',
      inputSchema: {},
    },
    async () =>
      callTool<{ unreadCount: number }>(() =>
        client.notifications.unreadCount({ query: {} }),
      ),
  );

  server.registerTool(
    'mark_notifications_read',
    {
      description:
        'Mark notifications as read. Pass notificationIds to mark specific ones; ' +
        'omit it (or pass an empty list) to mark all of your notifications as read.',
      inputSchema: {
        notificationIds: z
          .array(z.string())
          .optional()
          .describe('Specific notification IDs to mark read; omit to mark all'),
      },
    },
    async ({ notificationIds }) =>
      callTool(() =>
        notificationIds && notificationIds.length > 0
          ? client.notifications.markRead({ body: { notificationIds } })
          : client.notifications.markAllRead({ body: {} }),
      ),
  );
}
