import { api } from "@/lib/axios";

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string | null;
  supplier: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  userId: string;
  user: {
    id: string;
    name: string;
  };
  status: "DRAFT" | "ORDERED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  invoiceNumber: string | null;
  invoiceDate: Date | null;
  expectedDate: Date | null;
  paymentMethod: "CASH" | "MPESA" | "CARD" | "BANK_TRANSFER" | null;
  discountAmount: number;
  shippingCost: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  balanceDue: number;
  notes: string | null;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    items: number;
  };
  items: any[];
  payments: any[];
}

export const fetchPurchases = async (
  status?: string,
  search?: string,
): Promise<Purchase[]> => {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (search) params.append("search", search);
  
  const { data } = await api.get<Purchase[]>(`/api/purchases?${params.toString()}`);
  return data;
};

export const fetchPurchaseById = async (id: string): Promise<Purchase> => {
  const { data } = await api.get<Purchase>(`/api/purchases/${id}`);
  return data;
};
