import {
  parsePaginationParams,
  buildPaginationResult,
  PaginationParams,
} from "@/lib/pagination";

describe("parsePaginationParams", () => {
  it("returns defaults when no query params are provided", () => {
    const result = parsePaginationParams({});
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(0);
    expect(result.cursor).toBeUndefined();
  });

  it("parses valid limit and offset", () => {
    const result = parsePaginationParams({ limit: "25", offset: "50" });
    expect(result.limit).toBe(25);
    expect(result.offset).toBe(50);
  });

  it("clamps limit to MAX_LIMIT (100)", () => {
    const result = parsePaginationParams({ limit: "999" });
    expect(result.limit).toBe(100);
  });

  it("clamps limit to DEFAULT when below MIN_LIMIT", () => {
    const result = parsePaginationParams({ limit: "0" });
    expect(result.limit).toBe(10);
  });

  it("resets offset to 0 for negative values", () => {
    const result = parsePaginationParams({ offset: "-5" });
    expect(result.offset).toBe(0);
  });

  it("handles non-numeric limit gracefully", () => {
    const result = parsePaginationParams({ limit: "abc" });
    expect(result.limit).toBe(10);
  });

  it("handles non-numeric offset gracefully", () => {
    const result = parsePaginationParams({ offset: "xyz" });
    expect(result.offset).toBe(0);
  });

  it("parses cursor when provided", () => {
    const result = parsePaginationParams({ cursor: "abc123" });
    expect(result.cursor).toBe("abc123");
  });

  it("handles array query params by using the first value", () => {
    const result = parsePaginationParams({ limit: ["20", "30"], offset: ["10", "20"] });
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(10);
  });
});

describe("buildPaginationResult", () => {
  const params: PaginationParams = { limit: 10, offset: 0 };

  it("returns correct structure for full page", () => {
    const data = Array.from({ length: 10 }, (_, i) => ({ id: `id-${i}` }));
    const result = buildPaginationResult(data, 25, params);
    expect(result.data).toBe(data);
    expect(result.totalCount).toBe(25);
    expect(result.hasMore).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(0);
  });

  it("returns hasMore=false when all items fit on the page", () => {
    const data = Array.from({ length: 5 }, (_, i) => ({ id: `id-${i}` }));
    const result = buildPaginationResult(data, 5, params);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it("sets nextCursor using getCursorId when hasMore is true", () => {
    const data = Array.from({ length: 10 }, (_, i) => ({ id: `id-${i}` }));
    const result = buildPaginationResult(data, 25, params, (item) => item.id);
    expect(result.nextCursor).toBe("id-9");
  });

  it("returns nextCursor=null when hasMore is false even with getCursorId", () => {
    const data = Array.from({ length: 3 }, (_, i) => ({ id: `id-${i}` }));
    const result = buildPaginationResult(data, 3, params, (item) => item.id);
    expect(result.nextCursor).toBeNull();
  });

  it("handles empty data array", () => {
    const result = buildPaginationResult([], 0, params);
    expect(result.data).toHaveLength(0);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
    expect(result.totalCount).toBe(0);
  });

  it("correctly calculates hasMore with offset", () => {
    const data = Array.from({ length: 10 }, (_, i) => ({ id: `id-${i}` }));
    const paramsWithOffset: PaginationParams = { limit: 10, offset: 10 };
    const result = buildPaginationResult(data, 25, paramsWithOffset);
    // offset(10) + data.length(10) = 20 < totalCount(25) => hasMore = true
    expect(result.hasMore).toBe(true);
  });

  it("returns hasMore=false when offset+data equals totalCount", () => {
    const data = Array.from({ length: 5 }, (_, i) => ({ id: `id-${i}` }));
    const paramsWithOffset: PaginationParams = { limit: 10, offset: 20 };
    const result = buildPaginationResult(data, 25, paramsWithOffset);
    // offset(20) + data.length(5) = 25 === totalCount(25) => hasMore = false
    expect(result.hasMore).toBe(false);
  });
});
