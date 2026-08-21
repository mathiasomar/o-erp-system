import {
  createPurchase,
  PurchaseInput,
} from "@/actions/purchase.action";
import {
  fetchPurchaseById,
  fetchPurchases,
} from "@/lib/api/purchase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const usePurchases = (status?: string, search?: string) =>
  useQuery({
    queryKey: ["purchases", status, search],
    queryFn: () => fetchPurchases(status, search),
  });

export const usePurchase = (id: string) =>
  useQuery({
    queryKey: ["purchase", id],
    queryFn: () => fetchPurchaseById(id),
    enabled: !!id,
  });

export const useCreatePurchase = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: PurchaseInput) => createPurchase(v),
    onSuccess: (result) => {
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["purchases"] });
        toast.success("Purchase created");
        onSuccess?.();
      } else {
        toast.error("Failed to create purchase");
      }
    },
  });
};
