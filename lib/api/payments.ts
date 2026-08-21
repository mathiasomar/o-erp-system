import { api } from "@/lib/axios";
import { PaymentsResponse } from "@/types";

import { MpesaTransactionsResponse } from "@/types";

type MpesaFilters = {
  search?: string;
  status?: string;
  from?: string;
  to?: string;
};

type PaymentFilters = {
  search?: string;
  method?: string;
  from?: string;
  to?: string;
};

export const fetchPayments = async (filters?: PaymentFilters) => {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.method) params.set("method", filters.method);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);

  const { data } = await api.get<PaymentsResponse>(`/api/payments?${params}`);
  return data;
};

export const fetchMpesaTransactions = async (filters?: MpesaFilters) => {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);

  const { data } = await api.get<MpesaTransactionsResponse>(
    `/api/mpesa/transactions?${params}`,
  );
  return data;
};
