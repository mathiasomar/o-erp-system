import { api } from "@/lib/axios";
import { SearchResults } from "@/types";

export const fetchSearch = async (q: string): Promise<SearchResults> => {
  const { data } = await api.get<SearchResults>(
    `/api/search?q=${encodeURIComponent(q)}`,
  );
  return data;
};
