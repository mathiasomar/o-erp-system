import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useBranchId } from "./use-branches";

export type DailyStats = {
  date: string;
  summary: {
    todayRevenue: number;
    todayExpenses: number;
    todayProfit: number;
    todayOrders: number;
    pendingOrders: number;
    avgOrderValue: number;
    unitsSold: number;
    yestRevenue: number;
    yestExpenses: number;
    yestOrders: number;
    revDelta: number | null;
    expDelta: number | null;
  };
  hourlyBreakdown: { hour: string; orders: number; revenue: number }[];
  methodBreakdown: Record<string, { count: number; amount: number }>;
  topProductsToday: {
    id: string;
    name: string;
    category: string;
    units: number;
    revenue: number;
  }[];
  expenseByCategory: Record<string, number>;
  cashierPerformanceToday: { name: string; orders: number; revenue: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
    cashier: string;
    method: string | null;
  }[];
};

export const useDailyStats = () => {
  const branchId = useBranchId();
  return useQuery({
    queryKey: ["daily-stats", branchId],
    queryFn: async () => {
      const { data } = await api.get<DailyStats>("/api/dashboard/daily");
      return data;
    },
    staleTime: 1000 * 60, // 1 min
    refetchInterval: 1000 * 60 * 5, // auto-refresh every 5 min
  });
};
