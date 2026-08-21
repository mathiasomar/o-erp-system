import { useQuery } from "@tanstack/react-query";
import { fetchPayments } from "@/lib/api/payments";

type Filters = { search?: string; method?: string; from?: string; to?: string };

export function usePayments(filters?: Filters) {
  return useQuery({
    queryKey: ["payments", filters],
    queryFn: () => fetchPayments(filters),
  });
}
