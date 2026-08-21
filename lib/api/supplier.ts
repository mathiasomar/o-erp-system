import { api } from "@/lib/axios";

export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  contactName: string | null;
  taxPin: string | null;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE";
  branchId: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    purchases: number;
  };
}

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  const { data } = await api.get<Supplier[]>("/api/suppliers");
  return data;
};

export const fetchSupplierById = async (id: string): Promise<Supplier> => {
  const { data } = await api.get<Supplier>(`/api/suppliers/${id}`);
  return data;
};
