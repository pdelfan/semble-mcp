import { createSembleClient } from '@semble.so/api';

export type SembleClient = ReturnType<typeof createSembleClient>;

export interface SembleClientFromEnv {
  client: SembleClient;
  /** True when SEMBLE_API_KEY is set; gates registration of authenticated tools. */
  authenticated: boolean;
}

/**
 * Builds a Semble API client from environment variables.
 * Without SEMBLE_API_KEY the server still starts in anonymous mode —
 * ts-rest drops undefined header values, so no x-api-key header is sent
 * and only public (read-only) tools get registered.
 */
export function createClientFromEnv(): SembleClientFromEnv {
  const apiKey = process.env.SEMBLE_API_KEY;
  const baseUrl = process.env.SEMBLE_BASE_URL;
  const authenticated = Boolean(apiKey && apiKey.trim().length > 0);

  if (!authenticated) {
    console.error(
      'semble-mcp: SEMBLE_API_KEY is not set — running in anonymous mode ' +
        '(public read-only tools only).\n' +
        'To enable library and collection management, create an API key at ' +
        'https://semble.so/settings/api-keys and configure it, e.g.\n' +
        '  claude mcp add semble -e SEMBLE_API_KEY=sk_... -- npx -y @semble.so/mcp',
    );
  } else if (!apiKey!.startsWith('sk_')) {
    console.error(
      'semble-mcp: warning — SEMBLE_API_KEY does not start with "sk_"; ' +
        'this may not be a valid Semble API key.',
    );
  }

  const client = createSembleClient({
    // The SDK types apiKey as required, but it only sets an x-api-key
    // baseHeader — ts-rest removes undefined header values, so this is a
    // supported way to make unauthenticated requests.
    apiKey: authenticated ? apiKey! : (undefined as unknown as string),
    ...(baseUrl ? { baseUrl } : {}),
  });

  return { client, authenticated };
}
