import { jest } from '@jest/globals';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAllTools } from '../src/tools/index.js';
import type { SembleClient } from '../src/client.js';

const EXPECTED_TOOLS = [
  'add_url_to_library',
  'search_urls',
  'semantic_search',
  'list_my_cards',
  'get_card',
  'remove_card_from_library',
  'create_collection',
  'list_my_collections',
  'get_collection',
  'update_card_collections',
  'get_my_profile',
  'get_user_profile',
  'get_global_feed',
  'get_following_feed',
];

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
        cardById: ok,
        removeFromLibrary: ok,
        urlCardAssociations: ok,
      },
      collections: {
        createCollection: ok,
        myCollections: ok,
        collectionById: ok,
      },
      users: { myProfile: ok, userProfile: ok },
      feeds: { globalFeed: ok, followingFeed: ok },
      search: { semantic: ok },
    } as unknown as SembleClient,
    ok,
  };
}

describe('registerAllTools', () => {
  it('registers all 14 curated tools', () => {
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
