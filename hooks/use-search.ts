import { useQuery } from "@tanstack/react-query";
import { fetchSearch } from "@/lib/api/search";

export const useSearch = (query: string) =>
  useQuery({
    queryKey: ["global-search", query],
    queryFn: () => fetchSearch(query),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 10,
  });
