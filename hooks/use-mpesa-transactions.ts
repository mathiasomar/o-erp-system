import { useQuery } from "@tanstack/react-query";
import { fetchMpesaTransactions } from "@/lib/api/payments";

type Filters = { search?: string; status?: string; from?: string; to?: string };

export const useMpesaTransactions = (filters?: Filters) => {
  return useQuery({
    queryKey: ["mpesa-transactions", filters],
    queryFn: () => fetchMpesaTransactions(filters),
  });
};
