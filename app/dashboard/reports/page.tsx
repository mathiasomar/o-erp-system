"use client";

import { useState } from "react";
import { useReports } from "@/hooks/use-reports";
import { usePublicSettings } from "@/hooks/use-settings";
import { TrendChart } from "@/components/reports/TrendChart";
import { TopProductsTable } from "@/components/reports/TopProductsTable";
// import { PaymentPieChart } from "@/components/reports/PaymentPieChart";
import { exportReportCSV } from "@/lib/export/report-csv";
import { exportReportPDF } from "@/lib/export/report-pdf";
import { ReportRange } from "@/lib/api/reports";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  FileDown,
  FileText,
  Sheet,
  DollarSign,
  Users,
  Warehouse,
  RefreshCw,
  Coins,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BranchLabel } from "@/components/layout/BranchLabel";
import { PaymentBreakdown } from "@/components/dashboard/PaymentBreakdown";

const RANGES: { label: string; value: ReportRange }[] = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "3 months", value: "3m" },
  { label: "1 year", value: "1y" },
  { label: "Custom", value: "custom" },
];

export default function ReportsPage() {
  const [range, setRange] = useState<ReportRange>("30d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exporting, setExporting] = useState(false);

  const qc = useQueryClient();
  const { data: settings = {} } = usePublicSettings();
  const company = settings.company_name ?? "My Store";

  const { data, isLoading } = useReports(
    range,
    range === "custom" ? from : undefined,
    range === "custom" ? to : undefined,
  );

  const summary = data?.summary;

  const handleExportPDF = async () => {
    if (!data) return;
    setExporting(true);
    exportReportPDF(data, range, company);
    setExporting(false);
  };

  const handleExportCSV = () => {
    if (!data) return;
    exportReportCSV(data, range);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm">
            Business performance overview and data exports
          </p>
          <BranchLabel />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => qc.invalidateQueries({ queryKey: ["reports"] })}
          >
            <RefreshCw size={14} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!data || exporting}>
                <FileDown size={14} className="mr-1.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText size={14} className="mr-2 text-red-500" />
                PDF report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV}>
                <Sheet size={14} className="mr-2 text-green-500" />
                Excel / CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Range selector */}
      <div className="flex items-center flex-wrap gap-3">
        <Tabs value={range} onValueChange={(v) => setRange(v as ReportRange)}>
          <TabsList className="w-full flex flex-wrap h-auto">
            {RANGES.map((r) => (
              <TabsTrigger key={r.value} value={r.value}>
                {r.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {range === "custom" && (
          <div className="flex items-center flex-wrap gap-2 mt-4">
            <Input
              type="date"
              className="w-36 text-sm"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              className="w-36 text-sm"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* KPI cards - Updated with Profit metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          {
            label: "Revenue",
            value: `KES ${(summary?.totalRevenue ?? 0).toLocaleString()}`,
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-950/20",
          },
          {
            label: "COGS",
            value: `KES ${(summary?.totalCostOfGoods ?? 0).toLocaleString()}`,
            icon: Package,
            color: "text-orange-600",
            bg: "bg-orange-50 dark:bg-orange-950/20",
          },
          {
            label: "Gross Profit",
            value: `KES ${(summary?.totalGrossProfit ?? 0).toLocaleString()}`,
            icon: Coins,
            color: "text-purple-600",
            bg: "bg-purple-50 dark:bg-purple-950/20",
            sub: `Margin: ${summary?.grossMargin ?? 0}%`,
          },
          {
            label: "Expenses",
            value: `KES ${(summary?.totalExpenses ?? 0).toLocaleString()}`,
            icon: TrendingDown,
            color: "text-red-500",
            bg: "bg-red-50 dark:bg-red-950/20",
          },
          {
            label: "Net Profit",
            value: `KES ${(summary?.totalNetProfit ?? 0).toLocaleString()}`,
            icon: DollarSign,
            color:
              (summary?.totalNetProfit ?? 0) >= 0
                ? "text-blue-600"
                : "text-destructive",
            bg: "bg-blue-50 dark:bg-blue-950/20",
            sub: `Margin: ${summary?.overallMargin ?? 0}%`,
          },
          {
            label: "Orders",
            value: String(summary?.totalOrders ?? 0),
            sub: `${summary?.cancelledOrders ?? 0} cancelled · Avg: KES ${(summary?.avgOrderValue ?? 0).toFixed(0)}`,
            icon: ShoppingCart,
            color: "text-cyan-600",
            bg: "bg-cyan-50 dark:bg-cyan-950/20",
          },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-24 mt-1" />
                ) : (
                  <p className="text-xl font-bold leading-tight">{kpi.value}</p>
                )}
                {kpi.sub && !isLoading && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {kpi.sub}
                  </p>
                )}
              </div>
              <div className={`p-2 rounded-lg ${kpi.bg}`}>
                <kpi.icon size={16} className={kpi.color} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend chart */}
      <TrendChart data={data?.trendData ?? []} loading={isLoading} />

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="md:col-span-2 lg:col-span-1">
          <TopProductsTable
            products={data?.topProducts ?? []}
            loading={isLoading}
          />
        </div>
        <PaymentBreakdown
          data={data?.paymentBreakdown ?? {}}
          loading={isLoading}
        />
      </div>

      <Separator />

      {/* Inventory + stock movement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory stats */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Warehouse size={16} /> Inventory Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                label: "Total stock",
                value: summary?.totalStock.toLocaleString() ?? "—",
                color: "text-foreground",
              },
              {
                label: "Stock value",
                value: `KES ${(summary?.stockValue ?? 0).toLocaleString()}`,
                color: "text-green-600",
              },
              {
                label: "Low stock",
                value: String(summary?.lowStock ?? 0),
                color: "text-orange-500",
              },
              {
                label: "Out of stock",
                value: String(summary?.outOfStock ?? 0),
                color: "text-destructive",
              },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  {isLoading ? (
                    <Skeleton className="h-5 w-16 mt-1" />
                  ) : (
                    <p className={`text-lg font-bold ${item.color}`}>
                      {item.value}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Expense by category */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-semibold">Expenses by category</p>
              {isLoading ? (
                <Skeleton className="h-24 rounded" />
              ) : Object.keys(data?.expenseByCategory ?? {}).length === 0 ? (
                <p className="text-xs text-muted-foreground">No expenses</p>
              ) : (
                Object.entries(data?.expenseByCategory ?? {})
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate">
                        {cat}
                      </span>
                      <span className="font-medium shrink-0 ml-2">
                        KES {amt.toLocaleString()}
                      </span>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stock movement */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Package size={15} /> Recent Stock Movement
              </p>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 rounded" />
                  ))}
                </div>
              ) : (data?.stockMovement ?? []).length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">
                  No stock movement
                </p>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {data?.stockMovement.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between
                                 p-2.5 rounded-lg border text-sm gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{s.product}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.reason} · {s.date}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge
                          variant={s.change > 0 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {s.change > 0 ? `+${s.change}` : s.change}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {s.before} → {s.after}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cashier performance */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Users size={15} /> Cashier Performance
          </p>
          {isLoading ? (
            <Skeleton className="h-24 rounded" />
          ) : (data?.cashierPerformance ?? []).length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">
              No data
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {data?.cashierPerformance.map((c, i) => (
                <div key={c.name} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      #{i + 1}
                    </span>
                    <p className="text-sm font-medium truncate">{c.name}</p>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    KES {c.revenue.toLocaleString()}
                  </p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{c.orders} orders</span>
                    <span>Profit: KES {c.profit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Margin:</span>
                    <span
                      className={
                        c.margin >= 0 ? "text-green-600" : "text-red-500"
                      }
                    >
                      {c.margin}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
