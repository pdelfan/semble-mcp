import { jest } from '@jest/globals';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAllTools } from '../src/tools/index.js';
import type { SembleClient } from '../src/client.js';

const PUBLIC_TOOLS = [
  'search_urls',
  'semantic_search',
  'get_user_cards',
  'get_similar_urls',
  'get_card',
  'get_url_metadata',
  'get_url_libraries',
  'get_url_notes',
  'search_collections',
  'get_user_collections',
  'get_collection',
  'get_url_collections',
  'get_user_profile',
  'search_people',
  'get_following_users',
  'get_user_followers',
  'get_following_collections',
  'get_global_feed',
  'get_user_connections',
  'get_url_connections',
];

const AUTHENTICATED_TOOLS = [
  'add_url_to_library',
  'list_my_cards',
  'get_url_status',
  'remove_card_from_library',
  'create_collection',
  'list_my_collections',
  'update_collection',
  'delete_collection',
  'update_card_collections',
  'get_my_profile',
  'follow_target',
  'unfollow_target',
  'get_following_feed',
  'create_connection',
  'update_connection',
  'delete_connection',
  'get_my_notifications',
  'mark_notifications_read',
];

const EXPECTED_TOOLS = [...PUBLIC_TOOLS, ...AUTHENTICATED_TOOLS];

function mockClient() {
  const ok = jest
    .fn<() => Promise<{ status: number; body: unknown }>>()
    .mockResolvedValue({ status: 200, body: {} });
  return {
    client: {
      cards: {
        addUrlToLibrary: ok,
        searchCards: ok,
        myUrlCards: ok,
        cardsByUser: ok,
        urlLibraryStatus: ok,
        cardById: ok,
        urlMetadata: ok,
        librariesForUrl: ok,
        noteCardsForUrl: ok,
        removeFromLibrary: ok,
        urlCardAssociations: ok,
      },
      collections: {
        createCollection: ok,
        myCollections: ok,
        searchCollections: ok,
        collectionsByUser: ok,
        collectionById: ok,
        collectionsForUrl: ok,
        updateCollection: ok,
        deleteCollection: ok,
      },
      users: {
        myProfile: ok,
        userProfile: ok,
        followTarget: ok,
        unfollowTarget: ok,
        followingUsers: ok,
        userFollowers: ok,
        followingCollections: ok,
      },
      feeds: { globalFeed: ok, followingFeed: ok },
      search: { semantic: ok, similarUrls: ok, atProtoAccounts: ok },
      connections: {
        connectionsByUser: ok,
        connectionsForUrl: ok,
        createConnection: ok,
        updateConnection: ok,
        deleteConnection: ok,
      },
      notifications: {
        myNotifications: ok,
        markRead: ok,
        markAllRead: ok,
      },
    } as unknown as SembleClient,
    ok,
  };
}

describe('registerAllTools', () => {
  it('registers all curated tools', () => {
    const server = new McpServer({ name: 'test', version: '0' });
    const { client } = mockClient();
    registerAllTools(server, client);
    // _registeredTools is internal but stable enough for a smoke test.
    const names = Object.keys(
      (server as unknown as { _registeredTools: Record<string, unknown> })
        ._registeredTools,
    );
    expect(names.sort()).toEqual([...EXPECTED_TOOLS].sort());
  });

  it('registers only the public tools in anonymous mode', () => {
    const server = new McpServer({ name: 'test', version: '0' });
    const { client } = mockClient();
    registerAllTools(server, client, false);
    const names = Object.keys(
      (server as unknown as { _registeredTools: Record<string, unknown> })
        ._registeredTools,
    );
    expect(names.sort()).toEqual([...PUBLIC_TOOLS].sort());
  });

  it('maps add_url_to_library args to a body call', async () => {
    const server = new McpServer({ name: 'test', version: '0' });
    const { client } = mockClient();
    registerAllTools(server, client);
    const tools = (
      server as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: unknown, extra: unknown) => Promise<unknown> }
        >;
      }
    )._registeredTools;

    await tools['add_url_to_library']!.handler(
      { url: 'https://example.com', note: 'hi', collectionIds: ['c1'] },
      {},
    );
    expect(client.cards.addUrlToLibrary).toHaveBeenCalledWith({
      body: { url: 'https://example.com', note: 'hi', collectionIds: ['c1'] },
    });
  });

  it('maps get_user_profile args to a query call', async () => {
    const server = new McpServer({ name: 'test', version: '0' });
    const { client } = mockClient();
    registerAllTools(server, client);
    const tools = (
      server as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: unknown, extra: unknown) => Promise<unknown> }
        >;
      }
    )._registeredTools;

    await tools['get_user_profile']!.handler(
      { identifier: 'alice.bsky.social' },
      {},
    );
    expect(client.users.userProfile).toHaveBeenCalledWith({
      query: { identifier: 'alice.bsky.social', includeStats: undefined },
    });
  });
});
