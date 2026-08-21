import { api } from "@/lib/axios";
import { SystemSetting, SettingsMap } from "@/types";

export const fetchSettings = async (): Promise<SystemSetting[]> => {
  const { data } = await api.get<SystemSetting[]>("/api/settings");
  return data;
};

export const fetchPublicSettings = async (): Promise<SettingsMap> => {
  const { data } = await api.get<SettingsMap>("/api/settings/public");
  return data;
};
