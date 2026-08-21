import { useQuery } from "@tanstack/react-query";
import { fetchDashboard, DashboardRange } from "@/lib/api/dashboard";

export const useDashboard = (range: DashboardRange) => {
  return useQuery({
    queryKey: ["dashboard", range],
    queryFn: () => fetchDashboard(range),
    staleTime: 1000 * 60, // 1 min
  });
};
