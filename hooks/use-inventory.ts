import {
  adjustStock,
  AdjustStockInput,
  BulkAdjustItem,
  bulkAdjustStock,
} from "@/actions/inventory.action";
import {
  fetchInventory,
  fetchLowStock,
  fetchStockLogs,
} from "@/lib/api/inventories";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Input = {
  items: BulkAdjustItem[];
  sharedReason: string;
  sharedNote?: string;
};

export const useInventory = () => {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: fetchInventory,
  });
};

export const useLowStock = () => {
  return useQuery({
    queryKey: ["low-stock"],
    queryFn: fetchLowStock,
  });
};

export const useStockLogs = (productId: string) => {
  return useQuery({
    queryKey: ["stock-logs", productId],
    queryFn: () => fetchStockLogs(productId),
    enabled: !!productId,
  });
};

export const useAdjustStock = (onSuccess?: () => void) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: AdjustStockInput) => adjustStock(input),
    onSuccess: (result) => {
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["inventory"] });
        qc.invalidateQueries({ queryKey: ["low-stock"] });
        qc.invalidateQueries({ queryKey: ["products-all"] });
        qc.invalidateQueries({ queryKey: ["products"] });
        qc.invalidateQueries({ queryKey: ["notifications"] });
        toast.success("Stock updated successfully");
        onSuccess?.();
      } else {
        const err = result.error;
        const msg =
          typeof err === "object" && "root" in err
            ? err.root[0]
            : "Failed to update stock";
        toast.error(msg);
      }
    },
    onError: () => toast.error("Something went wrong"),
  });
};

export function useBulkAdjustStock(
  onSuccess?: (
    results: {
      productId: string | undefined;
      success: boolean;
      message?: string;
    }[],
  ) => void,
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ items, sharedReason, sharedNote }: Input) =>
      bulkAdjustStock(items, sharedReason, sharedNote),
    onSuccess: (results) => {
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["low-stock"] });
      qc.invalidateQueries({ queryKey: ["products-all"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });

      if (successCount > 0)
        toast.success(
          `${successCount} product${successCount !== 1 ? "s" : ""} updated`,
        );
      if (failCount > 0)
        toast.error(`${failCount} product${failCount !== 1 ? "s" : ""} failed`);

      onSuccess?.(results);
    },
    onError: () => toast.error("Bulk adjustment failed"),
  });
}
