import {
  hasPermission,
  getPermissionsForRoles,
  isValidRole,
  ROLE_PERMISSIONS,
  RoleName,
  Permission,
} from "@/lib/rbac";

describe("ROLE_PERMISSIONS", () => {
  it("defines permissions for ADMIN, MANAGER and VIEWER", () => {
    expect(ROLE_PERMISSIONS).toHaveProperty("ADMIN");
    expect(ROLE_PERMISSIONS).toHaveProperty("MANAGER");
    expect(ROLE_PERMISSIONS).toHaveProperty("VIEWER");
  });

  it("ADMIN has all permissions that MANAGER has", () => {
    for (const perm of ROLE_PERMISSIONS.MANAGER) {
      expect(ROLE_PERMISSIONS.ADMIN).toContain(perm);
    }
  });

  it("ADMIN has all permissions that VIEWER has", () => {
    for (const perm of ROLE_PERMISSIONS.VIEWER) {
      expect(ROLE_PERMISSIONS.ADMIN).toContain(perm);
    }
  });

  it("VIEWER has fewer permissions than MANAGER", () => {
    expect(ROLE_PERMISSIONS.VIEWER.length).toBeLessThan(
      ROLE_PERMISSIONS.MANAGER.length
    );
  });

  it("ADMIN includes MANAGE_ROLES and MANAGE_USERS", () => {
    expect(ROLE_PERMISSIONS.ADMIN).toContain("MANAGE_ROLES");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("MANAGE_USERS");
  });

  it("VIEWER does not include destructive permissions", () => {
    const destructive: Permission[] = [
      "CREATE_PRODUCT",
      "UPDATE_PRODUCT",
      "DELETE_PRODUCT",
    ];
    for (const perm of destructive) {
      expect(ROLE_PERMISSIONS.VIEWER).not.toContain(perm);
    }
  });
});

describe("hasPermission", () => {
  it("returns true when an ADMIN role grants the permission", () => {
    expect(hasPermission(["ADMIN"], "DELETE_PRODUCT")).toBe(true);
  });

  it("returns true when a VIEWER role grants the permission", () => {
    expect(hasPermission(["VIEWER"], "VIEW_PRODUCTS")).toBe(true);
  });

  it("returns false when a VIEWER role does not grant a destructive permission", () => {
    expect(hasPermission(["VIEWER"], "DELETE_PRODUCT")).toBe(false);
  });

  it("returns true when at least one role in an array grants the permission", () => {
    expect(hasPermission(["VIEWER", "MANAGER"], "CREATE_PRODUCT")).toBe(true);
  });

  it("returns false for an empty roles array", () => {
    expect(hasPermission([], "VIEW_PRODUCTS")).toBe(false);
  });

  it("returns false for a role with no matching permission", () => {
    expect(hasPermission(["VIEWER"], "MANAGE_ROLES")).toBe(false);
  });
});

describe("getPermissionsForRoles", () => {
  it("returns all permissions for a single role", () => {
    const perms = getPermissionsForRoles(["VIEWER"]);
    expect(perms).toEqual(expect.arrayContaining(ROLE_PERMISSIONS.VIEWER));
    expect(perms).toHaveLength(ROLE_PERMISSIONS.VIEWER.length);
  });

  it("deduplicates permissions when roles share them", () => {
    const perms = getPermissionsForRoles(["MANAGER", "VIEWER"]);
    const uniquePerms = Array.from(new Set(perms));
    expect(perms).toHaveLength(uniquePerms.length);
  });

  it("returns all permissions for ADMIN", () => {
    const perms = getPermissionsForRoles(["ADMIN"]);
    expect(perms.length).toBeGreaterThanOrEqual(ROLE_PERMISSIONS.ADMIN.length);
  });

  it("returns an empty array for an empty roles array", () => {
    const perms = getPermissionsForRoles([]);
    expect(perms).toHaveLength(0);
  });
});

describe("isValidRole", () => {
  it("returns true for ADMIN", () => {
    expect(isValidRole("ADMIN")).toBe(true);
  });

  it("returns true for MANAGER", () => {
    expect(isValidRole("MANAGER")).toBe(true);
  });

  it("returns true for VIEWER", () => {
    expect(isValidRole("VIEWER")).toBe(true);
  });

  it("returns false for an unknown role", () => {
    expect(isValidRole("SUPERUSER")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isValidRole("")).toBe(false);
  });

  it("returns false for a lowercase role name", () => {
    expect(isValidRole("admin")).toBe(false);
  });
});
