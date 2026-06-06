import { createSembleClient } from '@semble.so/api';

export type SembleClient = ReturnType<typeof createSembleClient>;

/**
 * Builds a Semble API client from environment variables.
 * Fails fast (stderr + exit 1) when SEMBLE_API_KEY is missing so MCP
 * clients surface a clear startup error instead of opaque tool failures.
 */
export function createClientFromEnv(): SembleClient {
  const apiKey = process.env.SEMBLE_API_KEY;
  const baseUrl = process.env.SEMBLE_BASE_URL;

  if (!apiKey || apiKey.trim().length === 0) {
    console.error(
      'semble-mcp: SEMBLE_API_KEY environment variable is not set.\n' +
        'Create an API key at https://semble.so/settings/api-keys and ' +
        'configure it in your MCP client, e.g.\n' +
        '  claude mcp add semble -e SEMBLE_API_KEY=sk_... -- npx -y @semble.so/mcp',
    );
    process.exit(1);
  }

  if (!apiKey.startsWith('sk_')) {
    console.error(
      'semble-mcp: warning — SEMBLE_API_KEY does not start with "sk_"; ' +
        'this may not be a valid Semble API key.',
    );
  }

  return createSembleClient({
    apiKey,
    ...(baseUrl ? { baseUrl } : {}),
  });
}
