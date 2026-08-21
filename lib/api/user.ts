import { api } from "@/lib/axios";
import { AppUser, UserActivity } from "@/types";

export const fetchUsers = async () => {
  const { data } = await api.get<AppUser[]>("/api/users");
  return data;
};

export const fetchUserById = async (id: string) => {
  const { data } = await api.get<AppUser>(`/api/users/${id}`);
  return data;
};

export type ActivityRange = "7d" | "30d" | "3m";

export const fetchUserActivity = async (id: string, range: ActivityRange) => {
  const { data } = await api.get<UserActivity>(
    `/api/users/${id}/activity?range=${range}`,
  );
  return data;
};
