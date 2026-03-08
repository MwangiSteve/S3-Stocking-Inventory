export interface PaginationParams {
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    pageCount: number;
  };
}

export function validatePaginationParams(limit?: number, offset?: number) {
  const validLimit = Math.min(Math.max(limit || 10, 1), 100);
  const validOffset = Math.max(offset || 0, 0);
  return { limit: validLimit, offset: validOffset };
}
