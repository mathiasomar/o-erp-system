import { useQuery } from "@tanstack/react-query";
import { fetchProfile, fetchProfileStats } from "@/lib/api/profile";

export const useProfile = (userId?: string) =>
  useQuery({
    queryKey: ["profile", userId],
    queryFn: fetchProfile,
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: "always",
  });

export const useProfileStats = () =>
  useQuery({
    queryKey: ["profile-stats"],
    queryFn: fetchProfileStats,
    staleTime: 1000 * 60 * 2,
  });
