import { api } from "@/lib/axios";
import { Product, ProductPerformance } from "@/types";

export type PerformanceRange = "7d" | "30d" | "3m" | "1y";

export async function fetchProducts(search?: string, categoryId?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (categoryId) params.set("categoryId", categoryId);

  const { data } = await api.get<Product[]>(`/api/products?${params}`);
  return data;
}

export async function fetchAllProducts() {
  const { data } = await api.get<Product[]>("/api/products/all");
  return data;
}

export async function fetchProductById(id: string) {
  const { data } = await api.get<Product>(`/api/products/${id}`);
  return data;
}

export async function fetchProductByBarcode(barcode: string) {
  const { data } = await api.get<Product>(`/api/products/barcode/${barcode}`);
  return data;
}

export const fetchProductPerformance = async (
  id: string,
  range: PerformanceRange,
): Promise<ProductPerformance> => {
  const { data } = await api.get<ProductPerformance>(
    `/api/products/${id}/performance?range=${range}`,
  );
  return data;
};
