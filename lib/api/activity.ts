import { api } from "@/lib/axios";
import { ActivityResponse } from "@/types";

type ActivityFilters = {
  search?: string;
  action?: string;
  entity?: string;
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export const fetchActivity = async (
  filters?: ActivityFilters,
): Promise<ActivityResponse> => {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.action) params.set("action", filters.action);
  if (filters?.entity) params.set("entity", filters.entity);
  if (filters?.userId) params.set("userId", filters.userId);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);
  params.set("page", String(filters?.page ?? 1));
  params.set("limit", String(filters?.limit ?? 50));

  const { data } = await api.get<ActivityResponse>(`/api/activity?${params}`);
  return data;
};
