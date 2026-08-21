// src/app/(dashboard)/branches/[id]/page.tsx

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  useBranches,
  useBranchInventory,
  useBranchStats,
} from "@/hooks/use-branches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Building2,
  Pencil,
  Users,
  ShoppingCart,
  TrendingUp,
  Package,
  DollarSign,
  Trophy,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { assignUserToBranch, switchBranch } from "@/actions/branch.action";
import { BranchSheet } from "@/components/branch/BranchSheet";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function BranchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  // Fetch branches list (we already have it from the list page hook)
  const { data: branches = [], isLoading: loadingBranch } = useBranches();
  const branch = branches.find((b) => b.id === id);

  const { data: stats, isLoading: loadingStats } = useBranchStats(id);
  const { data: inventory, isLoading: loadingInventory } =
    useBranchInventory(id);

  const [editOpen, setEditOpen] = useState(false);
  const [assigningUserId, setAssigningUserId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  // For staff assignment we need users — fetch them from your existing users hook
  // Users scoped to this branch come from branch._count.users
  // For "assign new user" we need users not yet in this branch
  // We'll use the admin user list endpoint directly

  const handleAssignUser = async () => {
    if (!assigningUserId) return;
    setAssignLoading(true);
    const result = await assignUserToBranch(assigningUserId, id);
    if (result.success) {
      qc.invalidateQueries({ queryKey: ["branches"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["branch-stats", id] });
      toast.success("User assigned to branch");
      setAssigningUserId("");
    } else {
      toast.error(result.error ?? "Failed to assign user");
    }
    setAssignLoading(false);
  };

  const handleSwitchToBranch = async () => {
    const result = await switchBranch(id);
    if (result.success) {
      qc.invalidateQueries();
      toast.success(`Viewing ${branch?.name}`);
      router.push("/dashboard");
    }
  };

  const outOfStock = (inventory ?? []).filter((i) => i.quantity === 0).length;
  const lowStock = (inventory ?? []).filter(
    (i) => i.quantity > 0 && i.quantity <= i.lowStockAt,
  ).length;

  if (loadingBranch && !branch) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!loadingBranch && !branch) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-96 gap-3">
        <Building2 size={32} className="text-muted-foreground/30" />
        <p className="text-muted-foreground">Branch not found</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/branches">
            <ArrowLeft size={14} className="mr-1.5" /> Go back
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto">
      {/* Header */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/branches">Branches</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{branch?.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/branches">
              <ArrowLeft size={14} />
            </Link>
          </Button>

          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/20">
            <Building2 size={20} className="text-blue-600" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{branch?.name}</h1>
              <Badge variant="outline" className="font-mono text-xs">
                {branch?.code}
              </Badge>
              {branch?.isDefault && <Badge>Default</Badge>}
              <Badge
                variant={branch?.isActive ? "default" : "secondary"}
                className="gap-1"
              >
                {branch?.isActive ? (
                  <>
                    <CheckCircle2 size={10} /> Active
                  </>
                ) : (
                  <>
                    <XCircle size={10} /> Inactive
                  </>
                )}
              </Badge>
            </div>

            {/* Contact info */}
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
              {branch?.address && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} /> {branch.address}
                </span>
              )}
              {branch?.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={11} /> {branch.phone}
                </span>
              )}
              {branch?.email && (
                <span className="flex items-center gap-1">
                  <Mail size={11} /> {branch.email}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch to this branch button */}
          <Button variant="outline" size="sm" onClick={handleSwitchToBranch}>
            <BarChart3 size={13} className="mr-1.5" />
            View data
          </Button>
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil size={13} className="mr-1.5" /> Edit
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Completed orders",
            value: loadingStats ? null : String(stats?.totalOrders ?? 0),
            sub: loadingStats ? null : `${stats?.last30Orders ?? 0} in 30 days`,
            icon: ShoppingCart,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-950/20",
          },
          {
            label: "Revenue",
            value: loadingStats
              ? null
              : `KES ${(stats?.totalRevenue ?? 0).toLocaleString()}`,
            sub: loadingStats
              ? null
              : `KES ${(stats?.revenue30 ?? 0).toLocaleString()} / 30d`,
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-950/20",
          },
          {
            label: "Expenses",
            value: loadingStats
              ? null
              : `KES ${(stats?.totalExpenses ?? 0).toLocaleString()}`,
            sub: "All time",
            icon: DollarSign,
            color: "text-red-500",
            bg: "bg-red-50 dark:bg-red-950/20",
          },
          {
            label: "Pending orders",
            value: loadingStats ? null : String(stats?.pendingOrders ?? 0),
            sub: "Awaiting completion",
            icon: Clock,
            color: "text-orange-600",
            bg: "bg-orange-50 dark:bg-orange-950/20",
          },
          {
            label: "Products",
            value: loadingStats ? null : String(stats?.productCount ?? 0),
            sub: loadingStats
              ? null
              : `${stats?.totalStock ?? 0} units in stock`,
            icon: Package,
            color: "text-purple-600",
            bg: "bg-purple-50 dark:bg-purple-950/20",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-1.5">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <div className={`p-1.5 rounded-lg ${s.bg}`}>
                  <s.icon size={13} className={s.color} />
                </div>
              </div>
              {s.value === null ? (
                <Skeleton className="h-6 w-20 mt-1" />
              ) : (
                <p className="text-lg font-bold leading-tight">{s.value}</p>
              )}
              {s.sub && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {s.sub}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">
            <Package size={13} className="mr-1.5" /> Inventory
          </TabsTrigger>
          <TabsTrigger value="staff">
            <Users size={13} className="mr-1.5" /> Staff
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Trophy size={13} className="mr-1.5" /> Performance
          </TabsTrigger>
        </TabsList>

        {/* ── Inventory ─────────────────────────────────────────────────── */}
        <TabsContent value="inventory" className="mt-4 space-y-4">
          <div className="flex items-center gap-4 text-sm">
            {[
              {
                label: "Out of stock",
                value: outOfStock,
                color: "text-destructive font-bold",
              },
              {
                label: "Low stock",
                value: lowStock,
                color: "text-orange-500 font-bold",
              },
              {
                label: "Total SKUs",
                value: inventory?.length ?? 0,
                color: "font-bold",
              },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className={s.color}>{s.value}</span>
                <span className="text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {["Product", "Category", "Stock", "Alert at"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-xs font-medium
                                  text-muted-foreground
                                  ${
                                    h === "Stock" || h === "Alert at"
                                      ? "text-right"
                                      : "text-left"
                                  }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingInventory ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (inventory ?? []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-muted-foreground text-sm"
                    >
                      No inventory records
                    </td>
                  </tr>
                ) : (
                  (inventory ?? []).map((item) => {
                    const isEmpty = item.quantity === 0;
                    const isLow = !isEmpty && item.quantity <= item.lowStockAt;
                    return (
                      <tr key={item.id} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {item.product.sku}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          {item.product.category ? (
                            <Badge
                              className="text-[10px] text-white"
                              style={{
                                backgroundColor:
                                  item.product.category.color ?? "#6b7280",
                              }}
                            >
                              {item.product.category.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge
                            variant={
                              isEmpty
                                ? "destructive"
                                : isLow
                                  ? "outline"
                                  : "secondary"
                            }
                            className={
                              isLow ? "border-orange-400 text-orange-600" : ""
                            }
                          >
                            {isEmpty
                              ? "Out of stock"
                              : `${item.quantity} units`}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                          ≤ {item.lowStockAt}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── Staff ─────────────────────────────────────────────────────── */}
        <TabsContent value="staff" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Use the Users page to assign users to this branch, or assign them
            when creating or editing a user.
          </p>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users size={14} />
                Assign existing user to this branch
              </p>
              <div className="flex gap-2">
                <Select
                  value={assigningUserId}
                  onValueChange={setAssigningUserId}
                >
                  <SelectTrigger className="flex-1 text-sm">
                    <SelectValue placeholder="Select a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {/* We load all users and let admin pick */}
                    <SelectItem value="placeholder" disabled>
                      Use Users page to manage assignments
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" disabled onClick={handleAssignUser}>
                  Assign
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                To assign a user: go to{" "}
                <button
                  className="underline text-primary"
                  onClick={() => router.push("/dashboard/users")}
                >
                  Users
                </button>{" "}
                → edit the user → select this branch.
              </p>
            </CardContent>
          </Card>

          {/* Stats only — we don't have a per-branch user list in this
              architecture since users have branchId, we'd need a separate
              API call. Point admin to users page which is already scoped. */}
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">
                {branch?._count?.users ?? 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Users assigned to this branch
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => router.push("/dashboard/users")}
              >
                <Users size={13} className="mr-1.5" />
                Manage users
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Performance ───────────────────────────────────────────────── */}
        <TabsContent value="performance" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revenue breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp size={14} className="text-green-600" />
                  Revenue breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    label: "All time revenue",
                    value: `KES ${(stats?.totalRevenue ?? 0).toLocaleString()}`,
                  },
                  {
                    label: "Last 30 days",
                    value: `KES ${(stats?.revenue30 ?? 0).toLocaleString()}`,
                  },
                  {
                    label: "Orders (last 30 days)",
                    value: String(stats?.last30Orders ?? 0),
                  },
                  {
                    label: "Total expenses",
                    value: `KES ${(stats?.totalExpenses ?? 0).toLocaleString()}`,
                  },
                  {
                    label: "Net profit (est.)",
                    value: `KES ${(
                      (stats?.totalRevenue ?? 0) - (stats?.totalExpenses ?? 0)
                    ).toLocaleString()}`,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between text-sm pb-2
                               border-b last:border-0 last:pb-0"
                  >
                    <span className="text-muted-foreground">{row.label}</span>
                    {loadingStats ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      <span className="font-semibold">{row.value}</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top products */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy size={14} className="text-amber-500" />
                  Top products by revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 rounded" />
                    ))}
                  </div>
                ) : (stats?.topProducts ?? []).length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center
                                  h-32 gap-2"
                  >
                    <Trophy size={20} className="text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      No sales data yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats?.topProducts.map((p, i) => {
                      const max = stats.topProducts[0]?.revenue ?? 1;
                      const pct = max > 0 ? (p.revenue / max) * 100 : 0;
                      return (
                        <div key={p.productId} className="space-y-1">
                          <div
                            className="flex items-center justify-between
                                          text-xs gap-2"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="text-muted-foreground
                                               shrink-0 font-mono w-4"
                              >
                                {i + 1}.
                              </span>
                              <span className="truncate">{p.productName}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-semibold">
                                KES {p.revenue.toLocaleString()}
                              </span>
                              <span className="text-muted-foreground ml-1.5">
                                ({p.units} units)
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full
                                         transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* View full reports button */}
          <div className="flex justify-end mt-4">
            <Button variant="outline" size="sm" onClick={handleSwitchToBranch}>
              <BarChart3 size={13} className="mr-1.5" />
              Switch to this branch to see full reports
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit branch sheet */}
      {branch && (
        <BranchSheet
          open={editOpen}
          onClose={() => setEditOpen(false)}
          branch={branch}
        />
      )}
    </div>
  );
}
