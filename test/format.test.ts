import {
  formatCard,
  formatCollection,
  formatFeedItem,
  formatPagination,
  formatUrlView,
  formatUser,
} from '../src/format.js';

const user = {
  id: 'did:plc:abc',
  handle: 'alice.bsky.social',
  name: 'Alice',
  avatarUrl: 'https://cdn.example/avatar.jpg',
  bannerUrl: 'https://cdn.example/banner.jpg',
  labels: [{ src: 'x', uri: 'y', val: 'z', cts: 'now', sig: new Uint8Array([1]) }],
  followerCount: 10,
};

describe('formatUser', () => {
  it('keeps handle/name/stats and drops avatar, banner, and label blobs', () => {
    const out = formatUser(user);
    expect(out).toEqual({
      handle: 'alice.bsky.social',
      name: 'Alice',
      followerCount: 10,
    });
    expect(JSON.stringify(out)).not.toContain('Uint8Array');
    expect(JSON.stringify(out)).not.toContain('avatar');
  });
});

describe('formatCard', () => {
  it('flattens cardContent and note, drops images and uris', () => {
    const out = formatCard({
      id: 'card-1',
      url: 'https://example.com/post',
      uri: 'at://did:plc:abc/network.cosmik.card/123',
      cardContent: {
        title: 'A post',
        description: 'About things',
        imageUrl: 'https://cdn.example/img.png',
        retrievedAt: '2026-01-01',
      },
      note: { id: 'note-1', text: 'my note' },
      libraryCount: 3,
      author: user,
      createdAt: '2026-06-01',
    } as never);
    expect(out).toEqual({
      id: 'card-1',
      url: 'https://example.com/post',
      title: 'A post',
      description: 'About things',
      note: 'my note',
      libraryCount: 3,
      savedBy: 'alice.bsky.social',
      createdAt: '2026-06-01',
    });
  });
});

describe('formatUrlView', () => {
  it('flattens metadata for search results', () => {
    expect(
      formatUrlView({
        url: 'https://example.com',
        metadata: { title: 'Example', imageUrl: 'x' } as never,
        urlLibraryCount: 5,
        urlInLibrary: true,
      }),
    ).toEqual({
      url: 'https://example.com',
      title: 'Example',
      libraryCount: 5,
      inMyLibrary: true,
    });
  });
});

describe('formatCollection', () => {
  it('keeps core fields and author handle only', () => {
    expect(
      formatCollection({
        id: 'col-1',
        name: 'Reading list',
        accessType: 'OPEN',
        cardCount: 7,
        author: user,
        createdAt: '2026-01-01',
        uri: 'at://...',
      } as never),
    ).toEqual({
      id: 'col-1',
      name: 'Reading list',
      accessType: 'OPEN',
      cardCount: 7,
      author: 'alice.bsky.social',
    });
  });
});

describe('formatFeedItem', () => {
  it('formats CARD_COLLECTED items with collection names', () => {
    const out = formatFeedItem({
      id: 'act-1',
      activityType: 'CARD_COLLECTED',
      user,
      createdAt: '2026-06-01',
      card: { id: 'card-1', url: 'https://example.com' },
      collections: [{ id: 'col-1', name: 'Reading list' }],
    });
    expect(out).toEqual({
      id: 'act-1',
      activityType: 'CARD_COLLECTED',
      actor: 'alice.bsky.social',
      createdAt: '2026-06-01',
      card: { id: 'card-1', url: 'https://example.com' },
      collections: ['Reading list'],
    });
  });
});

describe('formatPagination', () => {
  it('keeps paging fields and cursor', () => {
    expect(
      formatPagination({
        currentPage: 1,
        totalPages: 4,
        totalCount: 100,
        hasMore: true,
        nextCursor: 'abc',
      }),
    ).toEqual({
      currentPage: 1,
      totalPages: 4,
      totalCount: 100,
      hasMore: true,
      nextCursor: 'abc',
    });
    expect(formatPagination(undefined)).toBeUndefined();
  });
});
