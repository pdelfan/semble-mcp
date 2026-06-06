#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClientFromEnv } from './client.js';
import { createServer } from './server.js';

async function main() {
  const client = createClientFromEnv();
  const server = createServer(client);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdout is the JSON-RPC channel — diagnostics go to stderr only.
  console.error('semble-mcp: server running on stdio');
}

main().catch((error) => {
  console.error('semble-mcp: fatal error:', error);
  process.exit(1);
});
