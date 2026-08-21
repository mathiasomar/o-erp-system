"use client";

import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { fetchPermissions, fetchRolePermissions } from "@/lib/api/permissions";

export const usePermissions = () => {
  const { data: session } = authClient.useSession();
  const role = (session?.user?.role as string | undefined) ?? "CASHIER";

  const { data: permissions = [] } = useQuery({
    queryKey: ["role-permissions", role],
    queryFn: () => fetchRolePermissions(role),
    enabled: !!role,
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  return {
    role,
    permissions,
    can: (permission: string) => permissions.includes(permission),
  };
};

export const usePermissionsList = () =>
  useQuery({
    queryKey: ["permissions-list"],
    queryFn: fetchPermissions,
    staleTime: 1000 * 60 * 5,
  });

export const useRolePermissions = (role: string) =>
  useQuery({
    queryKey: ["role-permissions", role],
    queryFn: () => fetchRolePermissions(role),
    enabled: !!role,
  });
