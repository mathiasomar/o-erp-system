"use client";

import { useState, useTransition, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  Briefcase,
  User,
  Save,
  Loader2,
  RotateCcw,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  usePermissionsList,
  useRolePermissions,
} from "@/hooks/use-permissions";
import { updateRolePermissions } from "@/actions/permission.action";

// ── types ─────────────────────────────────────────────────────────────────────

type Role = "ADMIN" | "MANAGER" | "CASHIER";

type PermissionItem = {
  id: string;
  key: string;
  label: string;
  group: string;
};

// ── constants ─────────────────────────────────────────────────────────────────

const ROLES: {
  value: Role;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  badge: "default" | "secondary" | "outline";
}[] = [
  {
    value: "ADMIN",
    label: "Admin",
    icon: Shield,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/20",
    badge: "default",
  },
  {
    value: "MANAGER",
    label: "Manager",
    icon: Briefcase,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    badge: "secondary",
  },
  {
    value: "CASHIER",
    label: "Cashier",
    icon: User,
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/20",
    badge: "outline",
  },
];

// Permissions that ADMIN can never lose
const ADMIN_LOCKED: string[] = [
  "users.view",
  "users.edit",
  "settings.view",
  "settings.edit",
  "dashboard.view",
];

// ── group header colors ───────────────────────────────────────────────────────

const GROUP_COLORS: Record<string, string> = {
  dashboard: "text-violet-600",
  products: "text-blue-600",
  categories: "text-teal-600",
  orders: "text-orange-600",
  inventory: "text-amber-600",
  expenses: "text-red-600",
  payments: "text-green-600",
  users: "text-pink-600",
  reports: "text-indigo-600",
  settings: "text-gray-600",
};

// ── role tab panel ────────────────────────────────────────────────────────────

const RolePanel = ({ role }: { role: Role }) => {
  const qc = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const { data: allPerms = [], isLoading: loadingPerms } = usePermissionsList();
  const { data: rolePerms = [], isLoading: loadingRole } =
    useRolePermissions(role);

  // Local state — what the admin has toggled
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [initialised, setInitialised] = useState(false);

  // Initialise selected from DB on first load
  if (!initialised && !loadingRole && rolePerms.length >= 0) {
    setSelected(new Set(rolePerms));
    setInitialised(true);
  }

  // Group permissions by module
  const grouped = useMemo(() => {
    const map: Record<string, PermissionItem[]> = {};
    for (const p of allPerms) {
      if (!map[p.group]) map[p.group] = [];
      map[p.group].push(p);
    }
    return map;
  }, [allPerms]);

  const isDirty = useMemo(() => {
    const current = new Set(rolePerms);
    if (current.size !== selected.size) return true;
    for (const k of selected) {
      if (!current.has(k)) return true;
    }
    return false;
  }, [selected, rolePerms]);

  const isLocked = (key: string) =>
    role === "ADMIN" && ADMIN_LOCKED.includes(key);

  const toggle = (key: string) => {
    if (isLocked(key)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleGroup = (keys: string[]) => {
    const unlocked = keys.filter((k) => !isLocked(k));
    const allOn = unlocked.every((k) => selected.has(k));
    setSelected((prev) => {
      const next = new Set(prev);
      unlocked.forEach((k) => (allOn ? next.delete(k) : next.add(k)));
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(allPerms.map((p) => p.key)));
  };

  const clearAll = () => {
    setSelected(new Set(ADMIN_LOCKED)); // keep locked ones
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateRolePermissions(role, [...selected]);
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["role-permissions", role] });
        qc.invalidateQueries({ queryKey: ["permissions-list"] });
        toast.success(`${role} permissions saved`);
        setInitialised(false); // re-sync from DB
      } else {
        toast.error(result.error ?? "Failed to save permissions");
      }
    });
  };

  const handleReset = () => {
    setSelected(new Set(rolePerms));
    setInitialised(false);
  };

  const isLoading = loadingPerms || loadingRole;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const selectedCount = selected.size;
  const totalCount = allPerms.length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {selectedCount} / {totalCount} permissions
          </Badge>
          {isDirty && (
            <Badge
              variant="outline"
              className="text-orange-600 border-orange-300"
            >
              Unsaved changes
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {role !== "ADMIN" && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={selectAll}
              >
                Select all
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={clearAll}
              >
                Clear all
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            disabled={!isDirty}
            onClick={handleReset}
          >
            <RotateCcw size={12} className="mr-1" />
            Reset
          </Button>
          <Button
            type="button"
            size="sm"
            className="text-xs h-7"
            disabled={!isDirty || isPending}
            onClick={handleSave}
          >
            {isPending ? (
              <Loader2 size={12} className="mr-1 animate-spin" />
            ) : (
              <Save size={12} className="mr-1" />
            )}
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Permission groups */}
      <div className="space-y-3">
        {Object.entries(grouped).map(([group, perms]) => {
          const groupKeys = perms.map((p) => p.key);
          const unlockedKeys = groupKeys.filter((k) => !isLocked(k));
          const allChecked =
            unlockedKeys.length > 0 &&
            unlockedKeys.every((k) => selected.has(k));
          const someChecked = unlockedKeys.some((k) => selected.has(k));
          const groupColor = GROUP_COLORS[group] ?? "text-muted-foreground";

          return (
            <div key={group} className="rounded-xl border overflow-hidden">
              {/* Group header */}
              <div
                className="flex items-center gap-3 px-4 py-2.5
                              bg-muted/40 border-b"
              >
                <Checkbox
                  checked={
                    allChecked ? true : someChecked ? "indeterminate" : false
                  }
                  onCheckedChange={() => toggleGroup(groupKeys)}
                  disabled={unlockedKeys.length === 0}
                  aria-label={`Toggle all ${group}`}
                />
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wide",
                    groupColor,
                  )}
                >
                  {group}
                </p>
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {groupKeys.filter((k) => selected.has(k)).length}/
                  {groupKeys.length}
                </Badge>
              </div>

              {/* Permissions in group */}
              <div className="divide-y">
                {perms.map((perm) => {
                  const checked = selected.has(perm.key);
                  const locked = isLocked(perm.key);

                  return (
                    <label
                      key={perm.key}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm",
                        "transition-colors select-none",
                        locked
                          ? "opacity-70 cursor-not-allowed bg-muted/20"
                          : "cursor-pointer hover:bg-muted/30",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(perm.key)}
                        disabled={locked}
                        aria-label={perm.label}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium leading-tight">
                          {perm.label}
                        </p>
                        <p className="text-[11px] font-mono text-muted-foreground">
                          {perm.key}
                        </p>
                      </div>
                      {locked && (
                        <div
                          className="flex items-center gap-1 text-[10px]
                                        text-muted-foreground shrink-0"
                        >
                          <Lock size={10} />
                          Required
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── main component ────────────────────────────────────────────────────────────

export const RolePermissionsManager = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield size={16} />
          Role Permissions
        </CardTitle>
        <CardDescription>
          Control exactly what each role can do. Changes take effect immediately
          for all users with that role.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="ADMIN">
          <TabsList className="w-full mb-6">
            {ROLES.map((r) => {
              const Icon = r.icon;
              return (
                <TabsTrigger
                  key={r.value}
                  value={r.value}
                  className="flex-1 gap-1.5"
                >
                  <Icon size={13} className={r.color} />
                  {r.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {ROLES.map((r) => (
            <TabsContent key={r.value} value={r.value}>
              {/* Role description banner */}
              <div
                className={cn(
                  "rounded-lg border p-3 mb-4 flex items-center gap-3",
                  r.bg,
                )}
              >
                <r.icon size={18} className={r.color} />
                <div>
                  <p className={cn("text-sm font-semibold", r.color)}>
                    {r.label} role
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.value === "ADMIN"
                      ? "Full system access. Some permissions are locked and cannot be removed."
                      : r.value === "MANAGER"
                        ? "Operational access. Cannot manage users or sensitive settings by default."
                        : "Limited access. Typically restricted to POS and order creation."}
                  </p>
                </div>
              </div>

              <RolePanel role={r.value} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
