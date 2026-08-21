import { api } from "@/lib/axios";
import { Order } from "@/types";

type OrderFilters = {
  search?: string;
  status?: string;
  from?: string;
  to?: string;
};

export const fetchOrders = async (filters?: OrderFilters) => {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);

  const { data } = await api.get<Order[]>(`/api/orders?${params}`);
  return data;
};

export const fetchOrderById = async (id: string) => {
  const { data } = await api.get<Order>(`/api/orders/${id}`);
  return data;
};
