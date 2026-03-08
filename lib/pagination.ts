export interface PaginationParams {
  limit: number;
  offset: number;
  cursor?: string;
}

export interface PaginationResult<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
  nextCursor: string | null;
  limit: number;
  offset: number;
}

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const MIN_LIMIT = 1;

/**
 * Parse and validate pagination query parameters from a request.
 * Supports both limit/offset and cursor-based pagination.
 *
 * @param query - The query object from a NextApiRequest
 * @returns Validated PaginationParams
 */
export function parsePaginationParams(query: Record<string, string | string[] | undefined>): PaginationParams {
  const rawLimit = Array.isArray(query.limit) ? query.limit[0] : query.limit;
  const rawOffset = Array.isArray(query.offset) ? query.offset[0] : query.offset;
  const rawCursor = Array.isArray(query.cursor) ? query.cursor[0] : query.cursor;

  let limit = rawLimit ? parseInt(rawLimit, 10) : DEFAULT_LIMIT;
  let offset = rawOffset ? parseInt(rawOffset, 10) : 0;

  if (isNaN(limit) || limit < MIN_LIMIT) {
    limit = DEFAULT_LIMIT;
  }
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  if (isNaN(offset) || offset < 0) {
    offset = 0;
  }

  return {
    limit,
    offset,
    cursor: rawCursor || undefined,
  };
}

/**
 * Build a paginated response object.
 *
 * @param data - The items for the current page
 * @param totalCount - Total number of items across all pages
 * @param params - The current pagination parameters
 * @param getCursorId - Optional function to extract a cursor string from the last item
 * @returns A PaginationResult object
 */
export function buildPaginationResult<T extends object>(
  data: T[],
  totalCount: number,
  params: PaginationParams,
  getCursorId?: (item: T) => string
): PaginationResult<T> {
  const hasMore = params.offset + data.length < totalCount;
  const lastItem = data.length > 0 ? data[data.length - 1] : null;

  let nextCursor: string | null = null;
  if (hasMore && lastItem && getCursorId) {
    nextCursor = getCursorId(lastItem);
  }

  return {
    data,
    totalCount,
    hasMore,
    nextCursor,
    limit: params.limit,
    offset: params.offset,
  };
}
