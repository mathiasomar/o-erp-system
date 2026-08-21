import { useQuery } from "@tanstack/react-query";
import { fetchPublicSettings, fetchSettings } from "@/lib/api/settings";

export const useSettings = () =>
  useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    staleTime: 1000 * 60 * 5, // 5 min
  });

export const usePublicSettings = () =>
  useQuery({
    queryKey: ["settings-public"],
    queryFn: fetchPublicSettings,
    staleTime: 1000 * 60 * 5,
  });
