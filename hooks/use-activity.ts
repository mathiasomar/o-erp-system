import { useQuery } from "@tanstack/react-query";
import { fetchActivity } from "@/lib/api/activity";

type Filters = {
  search?: string;
  action?: string;
  entity?: string;
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export const useActivity = (filters?: Filters) =>
  useQuery({
    queryKey: ["activity", filters],
    queryFn: () => fetchActivity(filters),
    staleTime: 1000 * 30,
  });
