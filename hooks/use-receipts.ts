import { useQuery } from "@tanstack/react-query";
import { fetchReceipts } from "@/lib/api/receipts";

type Filters = {
  search?: string;
  status?: string;
  from?: string;
  to?: string;
};

export const useReceipts = (filters?: Filters) =>
  useQuery({
    queryKey: ["receipts", filters],
    queryFn: () => fetchReceipts(filters),
  });
