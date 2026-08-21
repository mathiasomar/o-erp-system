import prisma from "./prisma";

export const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  CASHIER: "CASHIER",
} as const;

export type Role = keyof typeof ROLES;

// ── Runtime permission cache ──────────────────────────────────────────────────
// Loaded once from DB and cached in memory per process.
// Use loadPermissions() to refresh after DB changes.

let permissionCache: Record<string, Set<string>> = {};
let cacheLoaded = false;

export const loadPermissions = async () => {
  // Import prisma lazily so this file is safe to import on the client

  const rolePermissions = await prisma.rolePermission.findMany({
    include: { permission: true },
  });

  const map: Record<string, Set<string>> = {
    ADMIN: new Set(),
    MANAGER: new Set(),
    CASHIER: new Set(),
  };

  for (const rp of rolePermissions) {
    if (!map[rp.role]) map[rp.role] = new Set();
    map[rp.role].add(rp.permission.key);
  }

  permissionCache = map;
  cacheLoaded = true;

  return map;
};

export const getPermissionsForRole = async (
  role: string,
): Promise<Set<string>> => {
  if (!cacheLoaded) await loadPermissions();
  return permissionCache[role.toUpperCase()] ?? new Set();
};

// ── Sync helpers (for client-side use with pre-fetched permissions) ────────────

export const hasPermission = (
  permissions: string[],
  permission: string,
): boolean => permissions.includes(permission);

export const canAccess = (
  userRole: string,
  permission: string,
  permissions: string[],
): boolean => hasPermission(permissions, permission);
