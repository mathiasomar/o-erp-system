import {
  createUser,
  CreateUserValues,
  toggleUserStatus,
  updateUser,
  UpdateUserValues,
} from "@/actions/user.action";
import {
  ActivityRange,
  fetchUserActivity,
  fetchUserById,
  fetchUsers,
} from "@/lib/api/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useUsers = () =>
  useQuery({ queryKey: ["users"], queryFn: fetchUsers });

export const useUser = (id: string) =>
  useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchUserById(id),
    enabled: !!id,
  });

export const useUserActivity = (id: string, range: ActivityRange) =>
  useQuery({
    queryKey: ["user-activity", id, range],
    queryFn: () => fetchUserActivity(id, range),
    enabled: !!id,
  });

export const useCreateUser = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: CreateUserValues) => createUser(v),
    onSuccess: (result) => {
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["users"] });
        toast.success("User created successfully");
        onSuccess?.();
      } else {
        toast.error("Failed to create user");
      }
    },
    onError: () => toast.error("Something went wrong"),
  });
};

export const useUpdateUser = (id: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: UpdateUserValues) => updateUser(id, v),
    onSuccess: (result) => {
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["users"] });
        qc.invalidateQueries({ queryKey: ["user", id] });
        toast.success("User updated");
        onSuccess?.();
      } else {
        toast.error("Failed to update user");
      }
    },
    onError: () => toast.error("Something went wrong"),
  });
};

export const useToggleUserStatus = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => toggleUserStatus(id),
    onSuccess: (result) => {
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["users"] });
        qc.invalidateQueries({ queryKey: ["user", id] });
        toast.success(result.isActive ? "User activated" : "User deactivated");
      }
    },
    onError: () => toast.error("Something went wrong"),
  });
};
