// src/app/(dashboard)/analytics/page.tsx

"use client";

import { useState } from "react";
import { useAnalytics } from "@/hooks/use-analytics";
import { ReportRange } from "@/lib/api/reports";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Clock,
  Calendar,
  Tag,
  Users,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BranchLabel } from "@/components/layout/BranchLabel";

const RANGES: { label: string; value: ReportRange }[] = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "3 months", value: "3m" },
  { label: "1 year", value: "1y" },
];

const METHOD_COLORS: Record<string, string> = {
  CASH: "#22c55e",
  MPESA: "#3b82f6",
  CARD: "#8b5cf6",
};

const HEAT_COLORS = [
  "#f0f9ff",
  "#bae6fd",
  "#7dd3fc",
  "#38bdf8",
  "#0ea5e9",
  "#0284c7",
];

const heatColor = (value: number, max: number): string => {
  if (max === 0) return HEAT_COLORS[0];
  const idx = Math.floor((value / max) * (HEAT_COLORS.length - 1));
  return HEAT_COLORS[Math.min(idx, HEAT_COLORS.length - 1)];
};

export default function AnalyticsPage() {
  //   usePageTitle("Analytics");
  const [range, setRange] = useState<ReportRange>("30d");
  const qc = useQueryClient();

  const { data, isLoading } = useAnalytics(range);
  // const kpis = data?.kpis;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Analytics</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Deep insights into sales patterns and performance
          </p>
          <BranchLabel />
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={range} onValueChange={(v) => setRange(v as ReportRange)}>
            <TabsList className="w-full flex flex-wrap h-auto my-2">
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
            onClick={() => qc.invalidateQueries({ queryKey: ["analytics"] })}
          >
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Revenue",
            value: `KES ${(kpis?.totalRevenue ?? 0).toLocaleString()}`,
            icon: TrendingUp,
            color: "text-green-600",
          },
          {
            label: "Expenses",
            value: `KES ${(kpis?.totalExpenses ?? 0).toLocaleString()}`,
            icon: DollarSign,
            color: "text-red-500",
          },
          {
            label: "Margin",
            value: `${kpis?.grossMargin ?? 0}%`,
            icon: BarChart3,
            color: "text-blue-600",
          },
          {
            label: "Orders",
            value: String(kpis?.totalOrders ?? 0),
            icon: ShoppingCart,
            color: "text-purple-600",
          },
          {
            label: "Avg Order",
            value: `KES ${(kpis?.avgOrderValue ?? 0).toFixed(0)}`,
            icon: Users,
            color: "text-orange-600",
          },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-20 mt-1" />
                ) : (
                  <p className="text-xl font-bold">{kpi.value}</p>
                )}
              </div>
              <kpi.icon size={18} className={kpi.color} />
            </CardContent>
          </Card>
        ))}
      </div> */}

      {/* Hourly heatmap + Day of week */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak hours heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock size={16} />
              Peak Hours
            </CardTitle>
            <CardDescription>Order volume by hour of day</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 rounded-lg" />
            ) : (
              <>
                <div className="grid grid-cols-12 gap-1 mb-2">
                  {data?.hourlyData.slice(0, 12).map((h) => {
                    const max = Math.max(
                      ...(data?.hourlyData.map((x) => x.orders) ?? [1]),
                      1,
                    );
                    return (
                      <div
                        key={h.hour}
                        title={`${h.label}: ${h.orders} orders`}
                        className="aspect-square rounded-sm cursor-default
                                   transition-transform hover:scale-110"
                        style={{ backgroundColor: heatColor(h.orders, max) }}
                      />
                    );
                  })}
                </div>
                <div className="grid grid-cols-12 gap-1 mb-3">
                  {data?.hourlyData.slice(12).map((h) => {
                    const max = Math.max(
                      ...(data?.hourlyData.map((x) => x.orders) ?? [1]),
                      1,
                    );
                    return (
                      <div
                        key={h.hour}
                        title={`${h.label}: ${h.orders} orders`}
                        className="aspect-square rounded-sm cursor-default
                                   transition-transform hover:scale-110"
                        style={{ backgroundColor: heatColor(h.orders, max) }}
                      />
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Less</span>
                  <div className="flex gap-0.5">
                    {HEAT_COLORS.map((c) => (
                      <div
                        key={c}
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <span>More</span>
                  <span className="ml-auto">
                    {/* Show top 3 hours */}
                    Peak:{" "}
                    {data?.hourlyData
                      .slice()
                      .sort((a, b) => b.orders - a.orders)
                      .slice(0, 3)
                      .map((h) => h.label)
                      .join(", ")}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Day of week bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar size={16} />
              Busiest Days
            </CardTitle>
            <CardDescription>Revenue by day of week</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 rounded-lg" />
            ) : (
              <ChartContainer
                config={{ revenue: { label: "Revenue", color: "#3b82f6" } }}
                className="h-48 w-full"
              >
                <BarChart
                  data={data?.dayData}
                  margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                    width={40}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(v) => `KES ${Number(v).toLocaleString()}`}
                      />
                    }
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown + Order distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag size={16} />
              Revenue by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 rounded-lg" />
            ) : (data?.categoryBreakdown ?? []).length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                No data
              </p>
            ) : (
              (() => {
                const colors = [
                  "#3b82f6",
                  "#8b5cf6",
                  "#f97316",
                  "#22c55e",
                  "#ec4899",
                  "#14b8a6",
                ];
                const chartData = (data?.categoryBreakdown ?? []).map(
                  (c, i) => ({
                    name: c.name,
                    value: c.revenue,
                    fill: colors[i % colors.length],
                  }),
                );
                const config: ChartConfig = Object.fromEntries(
                  chartData.map((d) => [
                    d.name,
                    { label: d.name, color: d.fill },
                  ]),
                );
                return (
                  <ChartContainer config={config} className="h-48 w-full">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                      >
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(v) =>
                              `KES ${Number(v).toLocaleString()}`
                            }
                          />
                        }
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                    </PieChart>
                  </ChartContainer>
                );
              })()
            )}
          </CardContent>
        </Card>

        {/* Order size distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 size={16} />
              Order Size Distribution
            </CardTitle>
            <CardDescription>
              How many orders fall in each value range
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 rounded-lg" />
            ) : (
              <ChartContainer
                config={{ count: { label: "Orders", color: "#8b5cf6" } }}
                className="h-48 w-full"
              >
                <BarChart
                  data={data?.orderDistribution}
                  margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    width={30}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent formatter={(v) => `${v} orders`} />
                    }
                  />
                  <Bar
                    dataKey="count"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Cashier leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users size={16} />
            Cashier Leaderboard
          </CardTitle>
          <CardDescription>
            Ranked by revenue processed in selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 rounded-lg" />
          ) : (data?.cashierLeaderboard ?? []).length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">
              No cashier data
            </p>
          ) : (
            <div className="space-y-3">
              {data?.cashierLeaderboard.map((c, i) => {
                const maxRev = data.cashierLeaderboard[0].revenue;
                const pct = maxRev > 0 ? (c.revenue / maxRev) * 100 : 0;
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <div key={c.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm w-6 shrink-0">
                          {medals[i] ?? `#${i + 1}`}
                        </span>
                        <span className="font-medium truncate">{c.name}</span>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-xs text-green-600">
                            KES {c.revenue.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {c.orders} orders · avg KES {c.avgOrder.toFixed(0)}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {pct.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
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

      {/* Payment method radar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp size={16} />
            Payment Method Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 rounded-lg" />
          ) : (
            <div className="flex flex-wrap gap-6 items-center justify-center">
              {Object.entries(data?.methodTrend ?? {}).map(
                ([method, count]) => {
                  const total = Object.values(data?.methodTrend ?? {}).reduce(
                    (s, v) => s + v,
                    0,
                  );
                  const pct =
                    total > 0 ? ((count / total) * 100).toFixed(1) : "0";
                  return (
                    <div key={method} className="text-center space-y-1">
                      <div
                        className="w-16 h-16 rounded-full flex items-center
                                 justify-center mx-auto text-white font-bold text-sm"
                        style={{
                          backgroundColor: METHOD_COLORS[method] ?? "#6b7280",
                        }}
                      >
                        {pct}%
                      </div>
                      <p className="text-xs font-medium">{method}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {count} orders
                      </p>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
