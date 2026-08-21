import { api } from "@/lib/axios";
import { DashboardData } from "@/types";

export type DashboardRange = "7d" | "30d" | "3m";

export async function fetchDashboard(range: DashboardRange) {
  const { data } = await api.get<DashboardData>(
    `/api/dashboard?range=${range}`,
  );
  return data;
}
