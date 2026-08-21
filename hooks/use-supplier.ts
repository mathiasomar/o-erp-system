import {
  createSupplier,
  SupplierValues,
  updateSupplier,
} from "@/actions/supplier.action";
import {
  fetchSupplierById,
  fetchSuppliers,
} from "@/lib/api/supplier";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useSuppliers = () =>
  useQuery({
    queryKey: ["suppliers"],
    queryFn: () => fetchSuppliers(),
  });

export const useSupplier = (id: string) =>
  useQuery({
    queryKey: ["supplier", id],
    queryFn: () => fetchSupplierById(id),
    enabled: !!id,
  });

export const useCreateSupplier = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: SupplierValues) => createSupplier(v),
    onSuccess: (result) => {
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["suppliers"] });
        toast.success("Supplier created");
        onSuccess?.();
      } else {
        toast.error("Failed to create supplier");
      }
    },
  });
};

export const useUpdateSupplier = (id: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: SupplierValues) => updateSupplier(id, v),
    onSuccess: (result) => {
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["suppliers"] });
        qc.invalidateQueries({ queryKey: ["supplier", id] });
        toast.success("Supplier updated");
        onSuccess?.();
      } else {
        toast.error("Failed to update supplier");
      }
    },
  });
};
