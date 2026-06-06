import { callTool, errorResult } from '../src/result.js';

describe('callTool', () => {
  it('returns shaped body as text content on 2xx', async () => {
    const result = await callTool<{ id: string; heavy: string }>(
      async () => ({ status: 200, body: { id: 'abc', heavy: 'x' } }),
      (body) => ({ id: body.id }),
    );
    expect(result.isError).toBeUndefined();
    expect(result.content).toEqual([{ type: 'text', text: '{"id":"abc"}' }]);
  });

  it('passes body through unchanged when no shape fn given', async () => {
    const result = await callTool(async () => ({
      status: 200,
      body: { ok: true },
    }));
    expect(JSON.parse(result.content[0]!.text)).toEqual({ ok: true });
  });

  it('returns isError with message/code from error body on non-2xx', async () => {
    const result = await callTool(async () => ({
      status: 404,
      body: { message: 'Card not found', code: 'NOT_FOUND' },
    }));
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toBe(
      'Semble API error 404: Card not found (NOT_FOUND)',
    );
  });

  it('hints at API key problems on 401', async () => {
    const result = await callTool(async () => ({
      status: 401,
      body: { message: 'Unauthorized' },
    }));
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('SEMBLE_API_KEY');
  });

  it('handles non-object error bodies', async () => {
    const result = await callTool(async () => ({ status: 500, body: null }));
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toBe(
      'Semble API error 500: no error details provided',
    );
  });

  it('catches thrown errors as network errors', async () => {
    const result = await callTool(async () => {
      throw new Error('ECONNREFUSED');
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('ECONNREFUSED');
  });
});

describe('errorResult', () => {
  it('wraps a message with isError', () => {
    expect(errorResult('boom')).toEqual({
      content: [{ type: 'text', text: 'boom' }],
      isError: true,
    });
  });
});
