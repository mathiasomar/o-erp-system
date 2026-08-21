"use client";

import { useState, useTransition } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { AppUser } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowUpDown,
  Eye,
  Pencil,
  Shield,
  Briefcase,
  User,
  Trash2,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { UserSheet } from "./UserSheet";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { deleteUser } from "@/actions/user.action";
import { toast } from "sonner";

const roleConfig: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    variant: "default" | "secondary" | "outline";
    color: string;
  }
> = {
  ADMIN: {
    label: "Admin",
    icon: Shield,
    variant: "default",
    color: "text-red-500",
  },
  MANAGER: {
    label: "Manager",
    icon: Briefcase,
    variant: "secondary",
    color: "text-blue-500",
  },
  CASHIER: {
    label: "Cashier",
    icon: User,
    variant: "outline",
    color: "text-green-500",
  },
};

// ── Delete confirm dialog ─────────────────────────────────────────────────────

const DeleteUserDialog = ({
  user,
  open,
  onClose,
}: {
  user: AppUser;
  open: boolean;
  onClose: () => void;
}) => {
  const qc = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteUser(user.id);
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["users"] });
        toast.success(`${user.name} deleted`);
        onClose();
      } else {
        toast.error(
          typeof result.error === "string"
            ? result.error
            : "Failed to delete user",
        );
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 size={16} className="text-destructive" />
            Delete {user.name}?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-1">
            <span className="block">
              This will permanently delete <strong>{user.name}</strong> (
              {user.email}).
            </span>
            <span className="block text-destructive font-medium">
              Their orders and activity logs will be preserved but unlinked.
              This cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
            {isPending ? "Deleting..." : "Delete user"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const userColumns: ColumnDef<AppUser>[] = [
  // ── User ──────────────────────────────────────────────────────────────────
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        User <ArrowUpDown size={14} className="ml-1" />
      </Button>
    ),
    cell: ({ row }) => {
      const initials = row.original.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      return (
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs font-medium bg-muted">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-tight">
              {row.original.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.original.email}
            </p>
          </div>
        </div>
      );
    },
  },

  // ── Username ──────────────────────────────────────────────────────────────────
  {
    accessorKey: "username",
    header: "Username",
  },

  // ── Role ──────────────────────────────────────────────────────────────────
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const cfg = roleConfig[row.original.role] ?? roleConfig.CASHIER;
      const Icon = cfg.icon;
      return (
        <Badge variant={cfg.variant} className="gap-1">
          <Icon size={11} className={cfg.color} />
          {cfg.label}
        </Badge>
      );
    },
  },

  // ── Status ────────────────────────────────────────────────────────────────
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "secondary"}>
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  {
    accessorKey: "_count.orders",
    header: "Orders",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original._count.orders}
      </span>
    ),
  },

  // ── Joined ────────────────────────────────────────────────────────────────
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Joined <ArrowUpDown size={14} className="ml-1" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {format(new Date(row.original.createdAt), "dd MMM yyyy")}
      </span>
    ),
  },

  // ── Actions ───────────────────────────────────────────────────────────────
  {
    id: "actions",
    cell: ({ row }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [editOpen, setEditOpen] = useState(false);
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [deleteOpen, setDeleteOpen] = useState(false);

      return (
        <>
          <div className="flex items-center gap-1">
            {/* View */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="View user"
              asChild
            >
              <a href={`/dashboard/users/${row.original.id}`}>
                <Eye size={13} />
              </a>
            </Button>

            {/* Edit */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Edit user"
              onClick={() => setEditOpen(true)}
            >
              <Pencil size={13} />
            </Button>

            {/* Delete */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive
                         transition-colors"
              title="Delete user"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={13} />
            </Button>
          </div>
          <UserSheet
            open={editOpen}
            onClose={() => setEditOpen(false)}
            user={row.original}
          />

          <DeleteUserDialog
            user={row.original}
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
          />
        </>
      );
    },
  },
];
