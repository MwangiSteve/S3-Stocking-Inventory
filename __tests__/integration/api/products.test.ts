import { createMocks } from 'node-mocks-http';

jest.mock('@/prisma/client', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn()
    }
  }
}));

jest.mock('@/utils/auth', () => ({
  getSessionServer: jest.fn(),
  generateToken: jest.fn()
}));

import handler from '@/pages/api/v1/products/index';
import { prisma } from '@/prisma/client';
import { getSessionServer } from '@/utils/auth';

const mockSession = { id: 'user-123', name: 'Test User', email: 'test@example.com' };

describe('GET /api/v1/products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSessionServer as jest.Mock).mockResolvedValue(mockSession);
  });

  it('should return paginated products', async () => {
    const mockProduct = {
      id: '1',
      name: 'Product 1',
      quantity: BigInt(10),
      createdAt: new Date('2024-01-01')
    };

    (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
    (prisma.product.count as jest.Mock).mockResolvedValue(1);

    const { req, res } = createMocks({
      method: 'GET',
      query: { limit: '10', offset: '0' }
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('pagination');
    expect(data.pagination).toMatchObject({
      total: 1,
      limit: 10,
      offset: 0,
      hasMore: false,
      pageCount: 1
    });
  });

  it('should return 401 when not authenticated', async () => {
    (getSessionServer as jest.Mock).mockResolvedValue(null);

    const { req, res } = createMocks({
      method: 'GET',
      query: { limit: '10', offset: '0' }
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 405 for unsupported methods', async () => {
    const { req, res } = createMocks({ method: 'PATCH' });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(405);
  });

  it('should apply pagination limits correctly', async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.product.count as jest.Mock).mockResolvedValue(0);

    const { req, res } = createMocks({
      method: 'GET',
      query: { limit: '999', offset: '0' }
    });

    await handler(req as any, res as any);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );
  });
});
