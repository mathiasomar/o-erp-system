"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToggleUserStatus, useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Pencil,
  Shield,
  Briefcase,
  User,
  ShoppingCart,
  Receipt,
  Calendar,
  Mail,
  UserCheck,
  UserX,
  CheckCircle2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { UserActivityChart } from "@/components/users/UserActivityChart";
import { UserSheet } from "@/components/users/UserSheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// ── helpers ───────────────────────────────────────────────────────────────────

type Role = "ADMIN" | "MANAGER" | "CASHIER";

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: [
    "dashboard.view",
    "products.view",
    "products.create",
    "products.edit",
    "products.delete",
    "categories.view",
    "categories.create",
    "categories.edit",
    "categories.delete",
    "orders.view",
    "orders.create",
    "orders.cancel",
    "inventory.view",
    "inventory.adjust",
    "expenses.view",
    "expenses.create",
    "expenses.edit",
    "expenses.delete",
    "payments.view",
    "users.view",
    "users.create",
    "users.edit",
    "users.delete",
    "reports.view",
    "settings.view",
    "settings.edit",
  ],
  MANAGER: [
    "dashboard.view",
    "products.view",
    "products.create",
    "products.edit",
    "categories.view",
    "categories.create",
    "categories.edit",
    "orders.view",
    "orders.create",
    "orders.cancel",
    "inventory.view",
    "inventory.adjust",
    "expenses.view",
    "expenses.create",
    "expenses.edit",
    "payments.view",
    "reports.view",
    "settings.view",
    "settings.edit",
  ],
  CASHIER: [
    "dashboard.view",
    "products.view",
    "orders.view",
    "orders.create",
    "inventory.view",
    "payments.view",
  ],
};

const roleConfig: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
  }
> = {
  ADMIN: {
    label: "Admin",
    icon: Shield,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/20",
  },
  MANAGER: {
    label: "Manager",
    icon: Briefcase,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
  },
  CASHIER: {
    label: "Cashier",
    icon: User,
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/20",
  },
};

type DetailRowProps = {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
};

const DetailRow = ({ icon: Icon, label, value }: DetailRowProps) => (
  <div className="flex items-center justify-between py-2.5 text-sm border-b last:border-0">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon size={14} />
      {label}
    </div>
    <div className="font-medium">{value}</div>
  </div>
);

// ── page ──────────────────────────────────────────────────────────────────────

export default function UserViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);

  const { data: user, isLoading } = useUser(id);
  const { mutate: toggleStatus, isPending } = useToggleUserStatus(id);

  // ── loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-72 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  // ── not found ──────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div
        className="p-6 flex flex-col items-center justify-center
                      h-96 gap-3"
      >
        <p className="text-muted-foreground text-sm">User not found.</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft size={14} className="mr-1.5" /> Go back
        </Button>
      </div>
    );
  }

  const rc = roleConfig[user.role] ?? roleConfig.CASHIER;
  const RoleIcon = rc.icon;
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const rolePerms = ROLE_PERMISSIONS[user.role.toUpperCase() as Role] ?? [];

  // Group permissions by module (dedupe actions)
  const permGroups: Record<string, string[]> = {};
  rolePerms.forEach((p) => {
    const [module, action] = p.split(".");
    if (!permGroups[module]) permGroups[module] = [];
    if (!permGroups[module].includes(action)) permGroups[module].push(action);
  });

  // ── page ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/users">Users</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{user.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft size={16} />
          </Button>
          <Avatar className="h-12 w-12">
            <AvatarFallback
              className={`text-sm font-bold ${rc.bg} ${rc.color}`}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <Badge
                variant={user.isActive ? "default" : "secondary"}
                className="gap-1"
              >
                {user.isActive ? (
                  <>
                    <CheckCircle2 size={11} /> Active
                  </>
                ) : (
                  <>
                    <UserX size={11} /> Inactive
                  </>
                )}
              </Badge>
              <Badge variant="outline" className={`gap-1 ${rc.color}`}>
                <RoleIcon size={11} />
                {rc.label}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className={
              user.isActive
                ? "text-destructive border-destructive/40 hover:bg-destructive/10"
                : "text-green-600 border-green-300 hover:bg-green-50"
            }
            onClick={() => setToggleOpen(true)}
          >
            {user.isActive ? (
              <>
                <UserX size={14} className="mr-1.5" /> Deactivate
              </>
            ) : (
              <>
                <UserCheck size={14} className="mr-1.5" /> Activate
              </>
            )}
          </Button>
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil size={14} className="mr-1.5" /> Edit User
          </Button>
        </div>
      </div>

      <Separator />

      {/* ── Main grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity chart */}
        <div className="lg:col-span-2">
          <UserActivityChart userId={id} />
        </div>

        {/* User details */}
        <div className="space-y-4">
          {/* Account info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="divide-y px-6">
              <DetailRow icon={Mail} label="Email" value={user.email} />
              <DetailRow icon={User} label="Username" value={user.username} />
              <DetailRow
                icon={RoleIcon}
                label="Role"
                value={
                  <Badge variant="outline" className={`gap-1 ${rc.color}`}>
                    <RoleIcon size={11} />
                    {rc.label}
                  </Badge>
                }
              />
              <DetailRow
                icon={Calendar}
                label="Joined"
                value={format(new Date(user.createdAt), "dd MMM yyyy")}
              />
              <DetailRow
                icon={Calendar}
                label="Last updated"
                value={formatDistanceToNow(new Date(user.updatedAt), {
                  addSuffix: true,
                })}
              />
              <DetailRow
                icon={ShoppingCart}
                label="Total orders"
                value={<Badge variant="secondary">{user._count.orders}</Badge>}
              />
              <DetailRow
                icon={Receipt}
                label="Expenses logged"
                value={
                  <Badge variant="secondary">{user._count.expenses}</Badge>
                }
              />
            </CardContent>
          </Card>

          {/* Role permissions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield size={15} />
                Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(permGroups).map(([module, actions]) => (
                <div key={module}>
                  <p
                    className="text-xs font-semibold text-muted-foreground
                                uppercase tracking-wide mb-1.5"
                  >
                    {module}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {actions.map((action) => (
                      <Badge
                        key={action}
                        variant="secondary"
                        className="text-[10px] px-1.5"
                      >
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Edit sheet ─────────────────────────────────────────────────── */}
      <UserSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
      />

      {/* ── Toggle status dialog ───────────────────────────────────────── */}
      <AlertDialog open={toggleOpen} onOpenChange={setToggleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.isActive ? "Deactivate" : "Activate"} {user.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.isActive
                ? "This user will no longer be able to log in."
                : "This user will regain access to the system."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={
                user.isActive
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-green-600 hover:bg-green-700"
              }
              onClick={() => {
                toggleStatus();
                setToggleOpen(false);
              }}
              disabled={isPending}
            >
              {user.isActive ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
