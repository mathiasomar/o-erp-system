import { api } from "@/lib/axios";

export type PermissionItem = {
  id: string;
  key: string;
  label: string;
  group: string;
  description: string | null;
  rolePermissions: { role: string }[];
};

export const fetchPermissions = async (): Promise<PermissionItem[]> => {
  const { data } = await api.get<PermissionItem[]>("/api/permissions");
  return data;
};

export const fetchRolePermissions = async (role: string): Promise<string[]> => {
  const { data } = await api.get<string[]>(`/api/permissions/role/${role}`);
  return data;
};
