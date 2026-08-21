import { api } from "@/lib/axios";
import { Layaway } from "@/types";

export const fetchLayaways = async () => {
  const { data } = await api.get<Layaway[]>(`/api/layaway`);
  return data;
};

export const fetchLayawayById = async (id: string) => {
  const { data } = await api.get<Layaway>(`/api/layaway/${id}`);
  return data;
};
