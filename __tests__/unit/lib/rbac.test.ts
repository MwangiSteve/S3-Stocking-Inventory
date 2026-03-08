import { userHasPermission, Permission, getDefaultRole } from '@/lib/rbac';

jest.mock('@/prisma/client', () => ({
  prisma: {
    userRole: {
      findMany: jest.fn()
    }
  }
}));

import { prisma } from '@/prisma/client';

describe('RBAC System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow admin to access all permissions', async () => {
    (prisma.userRole.findMany as jest.Mock).mockResolvedValue([
      {
        role: { name: 'ADMIN' }
      }
    ]);

    const hasPermission = await userHasPermission(
      'user-123',
      Permission.DELETE_PRODUCT
    );

    expect(hasPermission).toBe(true);
  });

  it('should deny viewer from creating products', async () => {
    (prisma.userRole.findMany as jest.Mock).mockResolvedValue([
      {
        role: { name: 'VIEWER' }
      }
    ]);

    const hasPermission = await userHasPermission(
      'user-123',
      Permission.CREATE_PRODUCT
    );

    expect(hasPermission).toBe(false);
  });

  it('should allow viewer to view products', async () => {
    (prisma.userRole.findMany as jest.Mock).mockResolvedValue([
      {
        role: { name: 'VIEWER' }
      }
    ]);

    const hasPermission = await userHasPermission(
      'user-123',
      Permission.VIEW_PRODUCTS
    );

    expect(hasPermission).toBe(true);
  });

  it('should allow manager to create products', async () => {
    (prisma.userRole.findMany as jest.Mock).mockResolvedValue([
      {
        role: { name: 'MANAGER' }
      }
    ]);

    const hasPermission = await userHasPermission(
      'user-123',
      Permission.CREATE_PRODUCT
    );

    expect(hasPermission).toBe(true);
  });

  it('should deny manager from managing users', async () => {
    (prisma.userRole.findMany as jest.Mock).mockResolvedValue([
      {
        role: { name: 'MANAGER' }
      }
    ]);

    const hasPermission = await userHasPermission(
      'user-123',
      Permission.MANAGE_USERS
    );

    expect(hasPermission).toBe(false);
  });

  it('should return false when permission check throws', async () => {
    (prisma.userRole.findMany as jest.Mock).mockRejectedValue(
      new Error('DB error')
    );

    const hasPermission = await userHasPermission(
      'user-123',
      Permission.VIEW_PRODUCTS
    );

    expect(hasPermission).toBe(false);
  });

  it('should return default role as VIEWER', () => {
    expect(getDefaultRole()).toBe('VIEWER');
  });
});
