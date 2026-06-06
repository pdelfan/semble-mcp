/**
 * Trims Semble API entities to compact, LLM-friendly shapes.
 * Drops images, banners, AT URIs, and label blobs (LabelSchema includes a
 * Uint8Array signature that must never be raw-stringified), keeps IDs,
 * text content, and pagination so the model can reason and page.
 */

type AnyRecord = Record<string, unknown>;

function compact<T extends AnyRecord>(obj: T): Partial<T> {
  const out: AnyRecord = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) out[key] = value;
  }
  return out as Partial<T>;
}

export interface UserLike {
  handle: string;
  name?: string;
  description?: string;
  followerCount?: number;
  followingCount?: number;
  urlCardCount?: number;
  collectionCount?: number;
  connectionCount?: number;
}

export function formatUser(user: UserLike) {
  return compact({
    handle: user.handle,
    name: user.name,
    description: user.description,
    followerCount: user.followerCount,
    followingCount: user.followingCount,
    urlCardCount: user.urlCardCount,
    collectionCount: user.collectionCount,
    connectionCount: user.connectionCount,
  });
}

export interface CardLike {
  id: string;
  url: string;
  cardContent?: {
    title?: string;
    description?: string;
    author?: string;
    siteName?: string;
    publishedDate?: string;
  };
  note?: { text: string };
  libraryCount?: number;
  urlLibraryCount?: number;
  author?: UserLike;
  createdAt?: string;
  collections?: CollectionLike[];
}

export function formatCard(card: CardLike) {
  return compact({
    id: card.id,
    url: card.url,
    title: card.cardContent?.title,
    description: card.cardContent?.description,
    siteName: card.cardContent?.siteName,
    contentAuthor: card.cardContent?.author,
    publishedDate: card.cardContent?.publishedDate,
    note: card.note?.text,
    libraryCount: card.libraryCount,
    savedBy: card.author?.handle,
    createdAt: card.createdAt,
    collections: card.collections?.map(formatCollection),
  });
}

/** Search results return UrlView (url + metadata), not full cards. */
export interface UrlViewLike {
  url: string;
  metadata?: {
    title?: string;
    description?: string;
    author?: string;
    siteName?: string;
  };
  urlLibraryCount?: number;
  urlInLibrary?: boolean;
}

export function formatUrlView(view: UrlViewLike) {
  return compact({
    url: view.url,
    title: view.metadata?.title,
    description: view.metadata?.description,
    siteName: view.metadata?.siteName,
    contentAuthor: view.metadata?.author,
    libraryCount: view.urlLibraryCount,
    inMyLibrary: view.urlInLibrary,
  });
}

export interface CollectionLike {
  id: string;
  name: string;
  description?: string;
  accessType?: string;
  cardCount?: number;
  author?: UserLike;
  followerCount?: number;
  createdAt?: string;
}

export function formatCollection(collection: CollectionLike) {
  return compact({
    id: collection.id,
    name: collection.name,
    description: collection.description,
    accessType: collection.accessType,
    cardCount: collection.cardCount,
    author: collection.author?.handle,
    followerCount: collection.followerCount,
  });
}

export interface FeedItemLike {
  id: string;
  activityType: string;
  user: UserLike;
  createdAt: unknown;
  card?: CardLike;
  collections?: CollectionLike[];
  connection?: AnyRecord;
}

export function formatFeedItem(item: FeedItemLike) {
  return compact({
    id: item.id,
    activityType: item.activityType,
    actor: item.user.handle,
    createdAt: item.createdAt,
    card: item.card ? formatCard(item.card) : undefined,
    collections: item.collections?.length
      ? item.collections.map((c) => c.name)
      : undefined,
  });
}

export interface PaginationLike {
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  hasMore?: boolean;
  nextCursor?: string;
}

export function formatPagination(pagination: PaginationLike | undefined) {
  if (!pagination) return undefined;
  return compact({
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    totalCount: pagination.totalCount,
    hasMore: pagination.hasMore,
    nextCursor: pagination.nextCursor,
  });
}
