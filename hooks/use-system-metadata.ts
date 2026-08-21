import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { SystemMetadata } from "@/types";
import { api } from "@/lib/axios";

/**
 * Hook to fetch and manage system metadata dynamically.
 * Automatically syncs with database settings changes via React Query.
 * The metadata includes database info, company details, and feature flags.
 */
export const useSystemMetadata = (): UseQueryResult<SystemMetadata> => {
  return useQuery<SystemMetadata, unknown, SystemMetadata>(
    ["system-metadata"],
    async (): Promise<SystemMetadata> => {
      const { data } = await api.get<SystemMetadata>("/api/metadata");
      return data;
    },
    {
      staleTime: 0, // Always treat as stale to stay in sync with settings
      cacheTime: 1000 * 60 * 5, // Cache for 5 minutes in background
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  );
};
