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
  'search_collections',
  'get_user_collections',
  'get_collection',
  'get_user_profile',
  'get_global_feed',
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
  'get_following_feed',
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
        removeFromLibrary: ok,
        urlCardAssociations: ok,
      },
      collections: {
        createCollection: ok,
        myCollections: ok,
        searchCollections: ok,
        collectionsByUser: ok,
        collectionById: ok,
        updateCollection: ok,
        deleteCollection: ok,
      },
      users: { myProfile: ok, userProfile: ok },
      feeds: { globalFeed: ok, followingFeed: ok },
      search: { semantic: ok, similarUrls: ok },
    } as unknown as SembleClient,
    ok,
  };
}

describe('registerAllTools', () => {
  it('registers all 21 curated tools', () => {
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

  it('registers only the 10 public tools in anonymous mode', () => {
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
