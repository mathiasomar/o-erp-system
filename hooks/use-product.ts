// src/hooks/useProducts.ts

import {
  createProduct,
  deleteProducts,
  updateProduct,
} from "@/actions/product.action";
import {
  fetchAllProducts,
  fetchProductByBarcode,
  fetchProductById,
  fetchProductPerformance,
  fetchProducts,
  PerformanceRange,
} from "@/lib/api/products";
import { ProductFormValues } from "@/lib/validations/product";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useProducts = (search?: string, categoryId?: string) => {
  return useQuery({
    queryKey: ["products", search, categoryId],
    queryFn: () => fetchProducts(search, categoryId),
  });
};

export const useProductByBarcode = (barcode: string) => {
  return useQuery({
    queryKey: ["product-barcode", barcode],
    queryFn: () => fetchProductByBarcode(barcode),
    enabled: !!barcode, // only runs when barcode is non-empty
  });
};

export function useAllProducts() {
  return useQuery({
    queryKey: ["products-all"],
    queryFn: fetchAllProducts,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProductById(id),
    enabled: !!id,
  });
}

export function useCreateProduct(onSuccess?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (values: ProductFormValues) => createProduct(values),
    onSuccess: (result) => {
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["products-all"] });
        qc.invalidateQueries({ queryKey: ["products"] });
        qc.invalidateQueries({ queryKey: ["categories"] });
        toast.success("Product created successfully");
        onSuccess?.();
      } else {
        toast.error("Failed to create product");
      }
    },
    onError: () => toast.error("Something went wrong"),
  });
}

export function useDeleteProducts(onSuccess?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => deleteProducts(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products-all"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      // toast.success("Products deleted successfully");
      onSuccess?.();
    },
    onError: () => toast.error("Something went wrong"),
  });
}

export function useUpdateProduct(id: string, onSuccess?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (values: ProductFormValues) => updateProduct(id, values),
    onSuccess: (result) => {
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["products-all"] });
        qc.invalidateQueries({ queryKey: ["products"] });
        qc.invalidateQueries({ queryKey: ["product", id] });
        toast.success("Product updated successfully");
        onSuccess?.();
      } else {
        toast.error("Failed to update product");
      }
    },
    onError: () => toast.error("Something went wrong"),
  });
}

export const useProductPerformance = (id: string, range: PerformanceRange) =>
  useQuery({
    queryKey: ["product-performance", id, range],
    queryFn: () => fetchProductPerformance(id, range),
    enabled: !!id,
  });
