import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  ...tseslint.configs.recommended,
  {
    rules: {
      // stdout is the JSON-RPC channel in stdio MCP servers —
      // diagnostics must go to stderr only.
      'no-console': ['error', { allow: ['error', 'warn'] }],
    },
  },
);
