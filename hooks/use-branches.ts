import {
  fetchBranches,
  fetchBranchId,
  fetchBranchInventory,
  fetchBranchStats,
} from "@/lib/api/branches.";
import { useQuery } from "@tanstack/react-query";

export const useBranches = () =>
  useQuery({ queryKey: ["branches"], queryFn: fetchBranches });

export const useBranchId = () =>
  useQuery({ queryKey: ["branch-id"], queryFn: fetchBranchId });

// Branch stats hook
export const useBranchStats = (id: string) =>
  useQuery({
    queryKey: ["branch-stats", id],
    queryFn: () => fetchBranchStats(id),
    enabled: !!id,
  });

// Branch inventory hook

export const useBranchInventory = (id: string) =>
  useQuery({
    queryKey: ["branch-inventory", id],
    queryFn: () => fetchBranchInventory(id),
    enabled: !!id,
  });
