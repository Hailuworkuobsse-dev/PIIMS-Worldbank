export interface PaginationParams {
  limit: number;
  cursor?: string;
  sort?: string;
}

export interface PaginationMeta {
  limit: number;
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const limitRaw = Number(query.limit ?? 25);
  const limit = Math.min(200, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 25));
  const cursor = typeof query.cursor === 'string' ? query.cursor : undefined;
  const sort = typeof query.sort === 'string' ? query.sort : '-createdAt';
  return { limit, ...(cursor ? { cursor } : {}), sort };
}

/** Encode an opaque cursor from an ID (base64) */
export function encodeCursor(id: string): string {
  return Buffer.from(id, 'utf8').toString('base64url');
}

/** Decode an opaque cursor back to an ID */
export function decodeCursor(cursor: string): string | null {
  try {
    return Buffer.from(cursor, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}

/** Build a PaginationMeta from a result set + 1 extra row (hasMore detection) */
export function buildPaginationMeta(
  rows: Array<{ id: string }>,
  limit: number,
  totalCount: number
): { rows: Array<{ id: string }>; meta: PaginationMeta } {
  const hasMore = rows.length > limit;
  const trimmed = hasMore ? rows.slice(0, limit) : rows;
  const last = trimmed[trimmed.length - 1];
  return {
    rows: trimmed,
    meta: {
      limit,
      totalCount,
      hasMore,
      ...(last && hasMore ? { nextCursor: encodeCursor(last.id) } : {})
    }
  };
}

/** Parse sort syntax: "-field,+field" → Prisma orderBy */
export function parseSort(
  sort: string | undefined,
  allowed: string[]
): Array<Record<string, 'asc' | 'desc'>> {
  if (!sort) return [{ createdAt: 'desc' }];
  return sort
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((field) => {
      const direction: 'asc' | 'desc' = field.startsWith('-') ? 'desc' : 'asc';
      const name = field.replace(/^[+-]/, '');
      return allowed.includes(name) ? { [name]: direction } : null;
    })
    .filter((x): x is Record<string, 'asc' | 'desc'> => x !== null);
}