import { api } from "@/lib/axios";
import { ProfileUser, ProfileStats } from "@/types";

export const fetchProfile = async (): Promise<ProfileUser> => {
  const { data } = await api.get<ProfileUser>("/api/profile");
  return data;
};

export const fetchProfileStats = async (): Promise<ProfileStats> => {
  const { data } = await api.get<ProfileStats>("/api/profile/stats");
  return data;
};
