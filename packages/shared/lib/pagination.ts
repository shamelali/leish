/** Mirrors the pagination parsing in GET /api/bookings. */
export function parsePagination(params: URLSearchParams) {
  const limit = Math.min(Math.max(Number(params.get("limit") ?? 20) || 20, 1), 100);
  const offset = Math.max(Number(params.get("offset") ?? 0) || 0, 0);
  return { limit, offset };
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export function paginate<T>(items: T[], params: PaginationParams): PaginatedResult<T> {
  const { limit, offset } = params;
  const total = items.length;
  const data = items.slice(offset, offset + limit);
  return {
    data,
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + limit < total,
    },
  };
}