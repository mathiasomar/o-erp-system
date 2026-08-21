import { useQuery } from "@tanstack/react-query";
import { fetchAnalytics, ReportRange } from "@/lib/api/reports";

export const useAnalytics = (range: ReportRange) =>
  useQuery({
    queryKey: ["analytics", range],
    queryFn: () => fetchAnalytics(range),
    staleTime: 1000 * 60 * 2,
  });
