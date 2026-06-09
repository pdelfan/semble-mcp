/**
 * Behavioral-hint presets for MCP tool annotations.
 *
 * Annotations are advisory hints (not enforced) that let clients render tool
 * titles, auto-allow safe reads, and prompt before destructive calls, and help
 * the model treat reads freely while being cautious with writes/deletes.
 *
 * Every Semble tool talks to the external Semble API, so `openWorldHint` is
 * true across the board. The `title` is set per-tool at the call site; spread
 * one of these presets after it: `{ title: 'Search URLs', ...READ_ONLY }`.
 */

export const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const;

export const WRITE = { readOnlyHint: false, openWorldHint: true } as const;

export const WRITE_IDEMPOTENT = {
  readOnlyHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

export const DESTRUCTIVE = {
  readOnlyHint: false,
  destructiveHint: true,
  openWorldHint: true,
} as const;
