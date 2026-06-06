import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SembleClient } from '../client.js';
import { registerCardTools } from './cards.js';
import { registerCollectionTools } from './collections.js';
import { registerFeedTools } from './feeds.js';
import { registerProfileTools } from './profile.js';

/**
 * Registers tools on the server. When authenticated is false, tools that
 * require an API key (writes and "my …" reads) are skipped so the model
 * never sees tools that can only fail with 401.
 */
export function registerAllTools(
  server: McpServer,
  client: SembleClient,
  authenticated = true,
) {
  registerCardTools(server, client, authenticated);
  registerCollectionTools(server, client, authenticated);
  registerProfileTools(server, client, authenticated);
  registerFeedTools(server, client, authenticated);
}
