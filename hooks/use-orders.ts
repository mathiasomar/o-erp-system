import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOrderById, fetchOrders } from "@/lib/api/orders";
import {
  cancelOrder,
  createOrder,
  CreateOrderInput,
} from "@/actions/order.action";
import { Order } from "@/types";
import { toast } from "sonner";
import { playErrorSound, playSuccessSound } from "@/lib/sounds";

type Filters = { search?: string; status?: string; from?: string; to?: string };

export const useOrders = (filters?: Filters) => {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: () => fetchOrders(filters),
  });
};

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => fetchOrderById(id),
    enabled: !!id,
  });
}

export const useCreateOrder = (onSuccess?: (order: Order) => void) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(input),
    onSuccess: (result) => {
      if (result.success && result.order) {
        playSuccessSound(); // Play chime
        qc.invalidateQueries({ queryKey: ["orders"] });
        qc.invalidateQueries({ queryKey: ["products-all"] });
        qc.invalidateQueries({ queryKey: ["products"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
        qc.invalidateQueries({ queryKey: ["reports"] });
        qc.invalidateQueries({ queryKey: ["analytics"] });
        toast.success(`Order ${result.order.orderNumber} created`);
        onSuccess?.(result.order as unknown as Order);
      } else {
        playErrorSound(); // error buzz
        const err = result.error;
        const msg =
          typeof err === "object" && "root" in err
            ? err.root[0]
            : "Failed to create order";
        toast.error(msg);
      }
    },
    onError: () => {
      playErrorSound(); // error buzz
      toast.error("Something went wrong");
    },
  });
};

export const useCancelOrder = (onSuccess?: () => void) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    onSuccess: (result) => {
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["orders"] });
        qc.invalidateQueries({ queryKey: ["products"] });
        toast.success("Order cancelled and stock restored");
        onSuccess?.();
      } else {
        playErrorSound(); // error buzz
        toast.error(result.error ?? "Failed to cancel order");
      }
    },
    onError: () => {
      playErrorSound(); // error buzz
      toast.error("Something went wrong");
    },
  });
};
