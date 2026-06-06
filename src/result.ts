/**
 * Maps ts-rest status-discriminated results to MCP tool results.
 * ts-rest clients do not throw on non-2xx — every call returns
 * `{ status, body }` and must be branched on status.
 */

type ToolContent = { type: 'text'; text: string };

export type ToolResult = {
  content: ToolContent[];
  isError?: boolean;
};

type TsRestResult = { status: number; body: unknown };

function textResult(value: unknown): ToolResult {
  return {
    content: [
      {
        type: 'text',
        text: typeof value === 'string' ? value : JSON.stringify(value),
      },
    ],
  };
}

export function errorResult(message: string): ToolResult {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

/** Extracts a human-readable message from an ErrorResponse-shaped body. */
function describeErrorBody(body: unknown): string {
  if (body && typeof body === 'object') {
    const { message, code } = body as { message?: unknown; code?: unknown };
    if (typeof message === 'string' && message.length > 0) {
      return typeof code === 'string' ? `${message} (${code})` : message;
    }
  }
  if (typeof body === 'string' && body.length > 0) return body;
  return 'no error details provided';
}

/**
 * Runs an SDK call and converts the outcome to an MCP tool result.
 * - 2xx → `shape(body)` JSON-stringified as text content
 * - non-2xx → `isError: true` with a concise message (auth errors get a hint)
 * - thrown errors (network etc.) → `isError: true`, never propagated
 */
export async function callTool<TBody>(
  fn: () => Promise<TsRestResult>,
  shape: (body: TBody) => unknown = (body) => body,
): Promise<ToolResult> {
  let result: TsRestResult;
  try {
    result = await fn();
  } catch (error) {
    return errorResult(
      `Network error calling the Semble API: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (result.status >= 200 && result.status < 300) {
    return textResult(shape(result.body as TBody));
  }

  const detail = describeErrorBody(result.body);
  if (result.status === 401 || result.status === 403) {
    return errorResult(
      `Semble API error ${result.status}: ${detail}. ` +
        'The SEMBLE_API_KEY may be missing, invalid, expired, or revoked — ' +
        'check https://semble.so/settings/api-keys.',
    );
  }
  return errorResult(`Semble API error ${result.status}: ${detail}`);
}
