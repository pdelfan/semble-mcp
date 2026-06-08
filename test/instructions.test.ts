import { serverInstructions } from '../src/instructions.js';

describe('serverInstructions', () => {
  it('always explains the core domain model', () => {
    for (const auth of [true, false]) {
      const text = serverInstructions(auth);
      expect(text).toMatch(/Semble/);
      expect(text).toMatch(/Card/);
      expect(text).toMatch(/Collection/);
      expect(text).toMatch(/handle/);
      expect(text).toMatch(/semantic_search/);
    }
  });

  it('describes anonymous limits only when unauthenticated', () => {
    expect(serverInstructions(false)).toMatch(/anonymous mode/);
    expect(serverInstructions(false)).toMatch(/SEMBLE_API_KEY/);
    expect(serverInstructions(true)).not.toMatch(/anonymous mode/);
  });

  it('mentions the authenticated tools only when authenticated', () => {
    expect(serverInstructions(true)).toMatch(/connected with an API key/);
    expect(serverInstructions(false)).not.toMatch(/connected with an API key/);
  });
});
