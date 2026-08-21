import {
  createExpense,
  deleteExpenses,
  updateExpense,
} from "@/actions/expense.action";
import {
  ChartRange,
  fetchExpenseCategories,
  fetchExpenseChart,
  fetchExpenses,
} from "@/lib/api/expenses";
import { ExpenseFormValues } from "@/lib/validations/expense";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Filters = {
  search?: string;
  categoryId?: string;
  method?: string;
  frequency?: string;
  from?: string;
  to?: string;
};

export const useExpenses = (filters?: Filters) => {
  return useQuery({
    queryKey: ["expenses", filters],
    queryFn: () => fetchExpenses(filters),
  });
};

export const useExpenseCategories = () => {
  return useQuery({
    queryKey: ["expense-categories"],
    queryFn: fetchExpenseCategories,
  });
};

export const useExpenseChart = (range: ChartRange) => {
  return useQuery({
    queryKey: ["expense-chart", range],
    queryFn: () => fetchExpenseChart(range),
  });
};

export const useCreateExpense = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ExpenseFormValues) => createExpense(values),
    onSuccess: (result) => {
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["expenses"] });
        qc.invalidateQueries({ queryKey: ["expense-chart"] });
        toast.success("Expense added");
        onSuccess?.();
      } else {
        toast.error("Failed to add expense");
      }
    },
    onError: () => toast.error("Something went wrong"),
  });
};

export const useUpdateExpense = (id: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ExpenseFormValues) => updateExpense(id, values),
    onSuccess: (result) => {
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["expenses"] });
        qc.invalidateQueries({ queryKey: ["expense-chart"] });
        toast.success("Expense updated");
        onSuccess?.();
      } else {
        toast.error("Failed to update expense");
      }
    },
    onError: () => toast.error("Something went wrong"),
  });
};

export const useDeleteExpenses = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteExpenses(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["expense-chart"] });
      toast.success("Expense(s) deleted");
      onSuccess?.();
    },
    onError: () => toast.error("Something went wrong"),
  });
};
