#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClientFromEnv } from './client.js';
import { createServer } from './server.js';

async function main() {
  const { client, authenticated } = createClientFromEnv();
  const server = createServer(client, authenticated);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdout is the JSON-RPC channel — diagnostics go to stderr only.
  console.error(
    `semble-mcp: server running on stdio${authenticated ? '' : ' (anonymous mode)'}`,
  );
}

main().catch((error) => {
  console.error('semble-mcp: fatal error:', error);
  process.exit(1);
});
