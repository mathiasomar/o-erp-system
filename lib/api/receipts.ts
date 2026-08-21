import { api } from "@/lib/axios";
import { Order } from "@/types";

type ReceiptFilters = {
  search?: string;
  status?: string;
  from?: string;
  to?: string;
};

export const fetchReceipts = async (filters?: ReceiptFilters) => {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);

  const { data } = await api.get<Order[]>(`/api/receipts?${params}`);
  return data;
};
