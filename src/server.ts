import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SembleClient } from './client.js';
import { registerAllTools } from './tools/index.js';

export const SERVER_NAME = 'semble';
export const SERVER_VERSION = '0.0.1';

/**
 * Builds the MCP server with all Semble tools registered.
 * Transport-agnostic: callers attach stdio (or, later, Streamable HTTP).
 */
export function createServer(client: SembleClient): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });
  registerAllTools(server, client);
  return server;
}
