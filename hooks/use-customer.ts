import {
  createCustomer,
  CustomerValues,
  updateCustomer,
} from "@/actions/customer.action";
import {
  fetchCustomerById,
  fetchCustomers,
  searchCustomers,
} from "@/lib/api/customer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useCustomers = (search?: string) =>
  useQuery({
    queryKey: ["customers", search],
    queryFn: () => fetchCustomers(search),
  });

export const useCustomer = (id: string) =>
  useQuery({
    queryKey: ["customer", id],
    queryFn: () => fetchCustomerById(id),
    enabled: !!id,
  });

export const useCustomerSearch = (q: string) =>
  useQuery({
    queryKey: ["customer-search", q],
    queryFn: () => searchCustomers(q),
    enabled: q.trim().length >= 2,
    staleTime: 1000 * 10,
  });

export const useCreateCustomer = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: CustomerValues) => createCustomer(v),
    onSuccess: (result) => {
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["customers"] });
        toast.success("Customer created");
        onSuccess?.();
      } else {
        toast.error("Failed to create customer");
      }
    },
  });
};

export const useUpdateCustomer = (id: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: CustomerValues) => updateCustomer(id, v),
    onSuccess: (result) => {
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["customers"] });
        qc.invalidateQueries({ queryKey: ["customer", id] });
        toast.success("Customer updated");
        onSuccess?.();
      } else {
        toast.error("Failed to update customer");
      }
    },
  });
};
