import { api } from "@/lib/axios";
import { Customer, CustomerDetail, CustomerSearchResult } from "@/types";

export const fetchCustomers = async (search?: string): Promise<Customer[]> => {
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  const { data } = await api.get<Customer[]>(`/api/customers${params}`);
  return data;
};

export const fetchCustomerById = async (
  id: string,
): Promise<CustomerDetail> => {
  const { data } = await api.get<CustomerDetail>(`/api/customers/${id}`);
  return data;
};

export const searchCustomers = async (
  q: string,
): Promise<CustomerSearchResult[]> => {
  const { data } = await api.get<CustomerSearchResult[]>(
    `/api/customers/search?q=${encodeURIComponent(q)}`,
  );
  return data;
};
