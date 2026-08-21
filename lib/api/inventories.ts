import { api } from "@/lib/axios";
import { InventoryItem, StockLog } from "@/types";

export const fetchInventory = async () => {
  const { data } = await api.get<InventoryItem[]>("/api/inventory");
  return data;
};

export const fetchLowStock = async () => {
  const { data } = await api.get<InventoryItem[]>("/api/inventory/low-stock");
  return data;
};

export const fetchStockLogs = async (productId: string) => {
  const { data } = await api.get<StockLog[]>(
    `/api/inventory/logs/${productId}`,
  );
  return data;
};
