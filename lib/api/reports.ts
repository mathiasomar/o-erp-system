import { api } from "@/lib/axios";
import { ReportData, AnalyticsData } from "@/types";

export type ReportRange = "7d" | "30d" | "3m" | "1y" | "custom";

export const fetchReports = async (
  range: ReportRange,
  from?: string,
  to?: string,
): Promise<ReportData> => {
  const params = new URLSearchParams({ range });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const { data } = await api.get<ReportData>(`/api/reports?${params}`);
  return data;
};

export const fetchAnalytics = async (
  range: ReportRange,
): Promise<AnalyticsData> => {
  const { data } = await api.get<AnalyticsData>(
    `/api/analytics?range=${range}`,
  );
  return data;
};
