import { api } from "@/lib/axios";
import { Branch } from "@/types";

export type BranchStats = {
  totalOrders: number;
  totalRevenue: number;
  last30Orders: number;
  revenue30: number;
  totalExpenses: number;
  productCount: number;
  totalStock: number;
  pendingOrders: number;
  topProducts: {
    productId: string;
    productName: string;
    units: number;
    revenue: number;
  }[];
};

export type BranchStockItem = {
  id: string;
  branchId: string;
  productId: string;
  quantity: number;
  lowStockAt: number;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
    price: number;
    category: { name: string; color: string | null } | null;
  };
};

export const fetchBranches = async (): Promise<Branch[]> => {
  const { data } = await api.get<Branch[]>("/api/branches");
  return data;
};

export const fetchBranchId = async (): Promise<string> => {
  const { data } = await api.get<{ branchId: string }>("/api/branch");
  return data.branchId;
};

export const fetchBranchStats = async (id: string): Promise<BranchStats> => {
  const { data } = await api.get<BranchStats>(`/api/branches/${id}/stats`);
  return data;
};

export const fetchBranchInventory = async (
  id: string,
): Promise<BranchStockItem[]> => {
  const { data } = await api.get<BranchStockItem[]>(
    `/api/branches/${id}/inventory`,
  );
  return data;
};
