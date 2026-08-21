import { useQuery } from "@tanstack/react-query";
import { fetchLayaways, fetchLayawayById } from "@/lib/api/layaways";
import { Layaway } from "@/types";

export const useLayaways = () => {
  return useQuery({
    queryKey: ["layaways"],
    queryFn: () => fetchLayaways(),
  });
};

export const useLayaway = (id?: string) => {
  return useQuery({
    queryKey: ["layaway", id],
    queryFn: () => (id ? fetchLayawayById(id) : Promise.reject("no id")),
    enabled: !!id,
  });
};
