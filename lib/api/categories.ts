import { api } from "@/lib/axios";
import { Category } from "@/types";

type CategoryWithCount = Category & {
  _count: { products: number };
  createdAt: string;
};

export async function fetchCategories() {
  const { data } = await api.get<CategoryWithCount[]>("/api/categories");
  return data;
}

export async function fetchCategoryById(id: string) {
  const { data } = await api.get<CategoryWithCount>(`/api/categories/${id}`);
  return data;
}
