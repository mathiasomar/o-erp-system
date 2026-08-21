import { api } from "@/lib/axios";
import { ExpensesResponse, ExpenseCategoryWithCount } from "@/types";

type ExpenseFilters = {
  search?: string;
  categoryId?: string;
  method?: string;
  frequency?: string;
  from?: string;
  to?: string;
};

export const fetchExpenses = async (filters?: ExpenseFilters) => {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.categoryId) params.set("categoryId", filters.categoryId);
  if (filters?.method) params.set("method", filters.method);
  if (filters?.frequency) params.set("frequency", filters.frequency);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);

  const { data } = await api.get<ExpensesResponse>(`/api/expenses?${params}`);
  return data;
};

export const fetchExpenseCategories = async () => {
  const { data } = await api.get<ExpenseCategoryWithCount[]>(
    "/api/expenses/categories",
  );
  return data;
};

export type ChartRange = "7d" | "30d" | "3m" | "1y";

export type ExpenseChartData = {
  chartData: { date: string; amount: number }[];
};

export const fetchExpenseChart = async (range: ChartRange) => {
  const { data } = await api.get<ExpenseChartData>(
    `/api/expenses/chart?range=${range}`,
  );
  return data;
};
