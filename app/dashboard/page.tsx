"use client";

import { useState } from "react";
import { useDashboard } from "@/hooks/use-dashboard";
import { DashboardRange } from "@/lib/api/dashboard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  Wallet,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { PaymentBreakdown } from "@/components/dashboard/PaymentBreakdown";
import { MpesaSummary } from "@/components/dashboard/MpesaSummary";
import { PlaceholderCard } from "@/components/dashboard/PlaceholderCard";
import { useBranchId } from "@/hooks/use-branches";
import { BranchLabel } from "@/components/layout/BranchLabel";
import { DailyStatsBanner } from "@/components/dashboard/DailyStatsBanner";
import { AiInsightsWidget } from "@/components/ai/AiInsightsWidget";

const RANGES: { label: string; value: DashboardRange }[] = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "3 months", value: "3m" },
];

export default function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>("7d");
  const qc = useQueryClient();
  const { data: branchId = "" } = useBranchId();
  const { data, isLoading } = useDashboard(range);

  const kpis = data?.kpis;
  const loading = isLoading;

  return (
    <div className="p-4 space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {format(new Date(), "EEEE, dd MMMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BranchLabel />
        </div>
      </div>

      <DailyStatsBanner />

      <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            Overal Performance
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            value={range}
            onValueChange={(v) => setRange(v as DashboardRange)}
          >
            <TabsList>
              {RANGES.map((r) => (
                <TabsTrigger key={r.value} value={r.value}>
                  {r.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => qc.invalidateQueries({ queryKey: ["dashboard"] })}
          >
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total revenue"
          value={
            loading ? "—" : `KES ${(kpis?.totalRevenue ?? 0).toLocaleString()}`
          }
          sub={`Last ${range === "7d" ? "7 days" : range === "30d" ? "30 days" : "3 months"}`}
          icon={TrendingUp}
          iconBg="bg-green-50 dark:bg-green-950/20"
          iconColor="text-green-600"
          loading={loading}
        />
        <KpiCard
          label="Net profit"
          value={
            loading ? "—" : `KES ${(kpis?.netProfit ?? 0).toLocaleString()}`
          }
          sub="Revenue minus expenses"
          icon={Wallet}
          iconBg={
            (kpis?.netProfit ?? 0) >= 0
              ? "bg-blue-50 dark:bg-blue-950/20"
              : "bg-destructive/10"
          }
          iconColor={
            (kpis?.netProfit ?? 0) >= 0 ? "text-blue-600" : "text-destructive"
          }
          loading={loading}
        />
        <KpiCard
          label="Expenses"
          value={
            loading
              ? "—"
              : `KES ${(kpis?.totalExpensesInRange ?? 0).toLocaleString()}`
          }
          sub="In selected period"
          icon={TrendingDown}
          iconBg="bg-red-50 dark:bg-red-950/20"
          iconColor="text-red-500"
          loading={loading}
        />
        <KpiCard
          label="Total orders"
          value={loading ? "—" : String(kpis?.totalOrders ?? 0)}
          sub={`${kpis?.completedOrders ?? 0} completed`}
          icon={ShoppingCart}
          iconBg="bg-purple-50 dark:bg-purple-950/20"
          iconColor="text-purple-600"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Active products"
          value={loading ? "—" : String(kpis?.totalProducts ?? 0)}
          sub={`${kpis?.totalCategories ?? 0} categories`}
          icon={Package}
          iconBg="bg-teal-50 dark:bg-teal-950/20"
          iconColor="text-teal-600"
          loading={loading}
        />
        <KpiCard
          label="Out of stock"
          value={loading ? "—" : String(kpis?.outOfStockItems ?? 0)}
          sub="Products need restocking"
          icon={AlertTriangle}
          iconBg={
            (kpis?.outOfStockItems ?? 0) > 0
              ? "bg-orange-50 dark:bg-orange-950/20"
              : "bg-muted"
          }
          iconColor={
            (kpis?.outOfStockItems ?? 0) > 0
              ? "text-orange-500"
              : "text-muted-foreground"
          }
          loading={loading}
        />
        <KpiCard
          label="All-time expenses"
          value={
            loading
              ? "—"
              : `KES ${(kpis?.totalExpensesAllTime ?? 0).toLocaleString()}`
          }
          sub="Total recorded expenses"
          icon={TrendingDown}
          iconBg="bg-red-50 dark:bg-red-950/20"
          iconColor="text-red-400"
          loading={loading}
        />
        {/* Placeholder — suppliers coming later */}
        <KpiCard
          label="Suppliers"
          value="—"
          sub="Coming soon"
          icon={Users}
          iconBg="bg-muted"
          iconColor="text-muted-foreground"
          loading={false}
        />
      </div>

      {/* ── Revenue chart ────────────────────────────────────────────────── */}
      <RevenueChart data={data?.chartData ?? []} loading={loading} />

      {/* ── Middle row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrders orders={data?.recentOrders ?? []} loading={loading} />
        </div>
        <div>
          <TopProducts products={data?.topProducts ?? []} loading={loading} />
        </div>
      </div>

      <Separator />

      {/* ── Bottom row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PaymentBreakdown
          data={data?.paymentBreakdown ?? []}
          loading={loading}
        />

        <MpesaSummary data={data?.mpesaStats ?? []} loading={loading} />

        <AiInsightsWidget />

        {/* Placeholder — activity log coming in Phase 6 */}
        <PlaceholderCard
          title="Activity Log"
          description="Recent system activity and user actions"
          icon={BarChart3}
          comingIn="Phase 6 — Roles & audit trail"
        />
      </div>
    </div>
  );
}
