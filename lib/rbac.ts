import { prisma } from "@/prisma/client";

export enum Permission {
  CREATE_PRODUCT = "CREATE_PRODUCT",
  UPDATE_PRODUCT = "UPDATE_PRODUCT",
  DELETE_PRODUCT = "DELETE_PRODUCT",
  VIEW_PRODUCTS = "VIEW_PRODUCTS",
  CREATE_CATEGORY = "CREATE_CATEGORY",
  UPDATE_CATEGORY = "UPDATE_CATEGORY",
  DELETE_CATEGORY = "DELETE_CATEGORY",
  VIEW_REPORTS = "VIEW_REPORTS",
  MANAGE_USERS = "MANAGE_USERS",
}

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: Object.values(Permission),
  MANAGER: [
    Permission.CREATE_PRODUCT,
    Permission.UPDATE_PRODUCT,
    Permission.DELETE_PRODUCT,
    Permission.VIEW_PRODUCTS,
    Permission.CREATE_CATEGORY,
    Permission.UPDATE_CATEGORY,
    Permission.DELETE_CATEGORY,
    Permission.VIEW_REPORTS,
  ],
  VIEWER: [Permission.VIEW_PRODUCTS, Permission.VIEW_REPORTS],
};

export async function userHasPermission(
  userId: string,
  requiredPermission: Permission
): Promise<boolean> {
  try {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    return userRoles.some((ur) =>
      ROLE_PERMISSIONS[ur.role.name]?.includes(requiredPermission)
    );
  } catch (error) {
    console.error("Permission check failed:", error);
    return false;
  }
}

export function getDefaultRole() {
  return "VIEWER";
}
