export type Permission =
  | "CREATE_PRODUCT"
  | "UPDATE_PRODUCT"
  | "DELETE_PRODUCT"
  | "VIEW_PRODUCTS"
  | "CREATE_CATEGORY"
  | "UPDATE_CATEGORY"
  | "DELETE_CATEGORY"
  | "VIEW_CATEGORIES"
  | "CREATE_SUPPLIER"
  | "UPDATE_SUPPLIER"
  | "DELETE_SUPPLIER"
  | "VIEW_SUPPLIERS"
  | "VIEW_AUDIT_LOGS"
  | "MANAGE_ROLES"
  | "MANAGE_USERS";

export type RoleName = "ADMIN" | "MANAGER" | "VIEWER";

export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  ADMIN: [
    "CREATE_PRODUCT",
    "UPDATE_PRODUCT",
    "DELETE_PRODUCT",
    "VIEW_PRODUCTS",
    "CREATE_CATEGORY",
    "UPDATE_CATEGORY",
    "DELETE_CATEGORY",
    "VIEW_CATEGORIES",
    "CREATE_SUPPLIER",
    "UPDATE_SUPPLIER",
    "DELETE_SUPPLIER",
    "VIEW_SUPPLIERS",
    "VIEW_AUDIT_LOGS",
    "MANAGE_ROLES",
    "MANAGE_USERS",
  ],
  MANAGER: [
    "CREATE_PRODUCT",
    "UPDATE_PRODUCT",
    "DELETE_PRODUCT",
    "VIEW_PRODUCTS",
    "CREATE_CATEGORY",
    "UPDATE_CATEGORY",
    "DELETE_CATEGORY",
    "VIEW_CATEGORIES",
    "CREATE_SUPPLIER",
    "UPDATE_SUPPLIER",
    "DELETE_SUPPLIER",
    "VIEW_SUPPLIERS",
    "VIEW_AUDIT_LOGS",
  ],
  VIEWER: [
    "VIEW_PRODUCTS",
    "VIEW_CATEGORIES",
    "VIEW_SUPPLIERS",
  ],
};

/**
 * Check whether a set of role names grants a required permission.
 */
export function hasPermission(roles: RoleName[], permission: Permission): boolean {
  return roles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission));
}

/**
 * Return all permissions granted by the given roles (deduplicated).
 */
export function getPermissionsForRoles(roles: RoleName[]): Permission[] {
  const perms = new Set<Permission>();
  for (const role of roles) {
    for (const perm of ROLE_PERMISSIONS[role] ?? []) {
      perms.add(perm);
    }
  }
  return Array.from(perms);
}

/**
 * Validate that a string is a known RoleName.
 */
export function isValidRole(role: string): role is RoleName {
  return Object.keys(ROLE_PERMISSIONS).includes(role);
}
