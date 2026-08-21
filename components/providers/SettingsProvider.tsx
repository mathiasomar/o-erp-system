"use client";

import { createContext, useContext } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { fetchPublicSettings } from "@/lib/api/settings";

type SettingsContextType = {
  settings: Record<string, string>;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType>({
  settings: {},
  isLoading: true,
  refresh: async () => {},
});

export const useSystemSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const qc = useQueryClient();

  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ["settings-public"],
    queryFn: fetchPublicSettings,
    staleTime: 0, // always re-fetch when invalidated
    refetchOnWindowFocus: false,
  });

  // Invalidate BOTH query keys — the full list and the public map
  const refresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["settings-public"] }),
      qc.invalidateQueries({ queryKey: ["settings"] }),
    ]);
    // Force an immediate refetch — don't just mark stale
    await qc.refetchQueries({ queryKey: ["settings-public"] });
  };

  return (
    <SettingsContext.Provider value={{ settings, isLoading, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
};
