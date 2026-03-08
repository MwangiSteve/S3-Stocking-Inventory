import { validatePaginationParams } from '@/lib/pagination';

describe('Pagination', () => {
  it('should validate correct pagination params', () => {
    const result = validatePaginationParams(10, 0);
    expect(result).toEqual({ limit: 10, offset: 0 });
  });

  it('should enforce maximum limit of 100', () => {
    const result = validatePaginationParams(200, 0);
    expect(result.limit).toBe(100);
  });

  it('should enforce minimum limit of 1 for negative values', () => {
    const result = validatePaginationParams(-5, 0);
    expect(result.limit).toBe(1);
  });

  it('should use defaults when not provided', () => {
    const result = validatePaginationParams();
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(0);
  });

  it('should enforce minimum offset of 0', () => {
    const result = validatePaginationParams(10, -5);
    expect(result.offset).toBe(0);
  });
});
