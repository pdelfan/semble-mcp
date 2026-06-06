import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SembleClient } from '../client.js';
import { registerCardTools } from './cards.js';
import { registerCollectionTools } from './collections.js';
import { registerFeedTools } from './feeds.js';
import { registerProfileTools } from './profile.js';

export function registerAllTools(server: McpServer, client: SembleClient) {
  registerCardTools(server, client);
  registerCollectionTools(server, client);
  registerProfileTools(server, client);
  registerFeedTools(server, client);
}
