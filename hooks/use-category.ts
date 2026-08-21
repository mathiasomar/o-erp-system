// src/hooks/useCategories.ts

import {
  createCategory,
  deleteCategories,
  updateCategory,
} from "@/actions/category.action";
import { fetchCategories, fetchCategoryById } from "@/lib/api/categories";
import { CategoryFormValues } from "@/lib/validations/category";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: Infinity, // categories rarely change
  });
};

export const useCategory = (id: string) => {
  return useQuery({
    queryKey: ["category", id],
    queryFn: () => fetchCategoryById(id),
    enabled: !!id,
  });
};

export const useCreateCategory = (onSuccess?: () => void) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (values: CategoryFormValues) => createCategory(values),
    onSuccess: (result) => {
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["categories"] });
        toast.success("Category created successfully");
        onSuccess?.();
      } else {
        toast.error("Failed to create category");
      }
    },
    onError: () => toast.error("Something went wrong"),
  });
};

export function useUpdateCategory(id: string, onSuccess?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (values: CategoryFormValues) => updateCategory(id, values),
    onSuccess: (result) => {
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["categories"] });
        qc.invalidateQueries({ queryKey: ["category", id] });
        qc.invalidateQueries({ queryKey: ["products-all"] });
        toast.success("Category updated successfully");
        onSuccess?.();
      } else {
        toast.error("Failed to update category");
      }
    },
    onError: () => toast.error("Something went wrong"),
  });
}

export const useDeleteCategory = (onSuccess?: () => void) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => deleteCategories(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      // toast.success("Category deleted successfully");
      onSuccess?.();
    },
    onError: () => toast.error("Something went wrong"),
  });
};
