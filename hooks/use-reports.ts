import { useQuery } from "@tanstack/react-query";
import { fetchReports, ReportRange } from "@/lib/api/reports";

export const useReports = (range: ReportRange, from?: string, to?: string) =>
  useQuery({
    queryKey: ["reports", range, from, to],
    queryFn: () => fetchReports(range, from, to),
    staleTime: 1000 * 60 * 2,
  });
