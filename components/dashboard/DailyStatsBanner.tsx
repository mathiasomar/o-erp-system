"use client";

import { useDailyStats } from "@/hooks/use-daily-stats";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Users,
  Banknote,
  Smartphone,
  CreditCard,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  Clock,
} from "lucide-react";

const Delta = ({ value }: { value: number | null }) => {
  if (value === null)
    return (
      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
        <Minus size={9} /> no yesterday data
      </span>
    );
  const up = value >= 0;
  return (
    <span
      className={`text-[10px] flex items-center gap-0.5 font-medium
      ${up ? "text-green-600" : "text-destructive"}`}
    >
      {up ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
      {Math.abs(value).toFixed(1)}% vs yesterday
    </span>
  );
};

const METHOD_ICONS: Record<string, React.ElementType> = {
  CASH: Banknote,
  MPESA: Smartphone,
  CARD: CreditCard,
};
const METHOD_COLORS: Record<string, string> = {
  CASH: "text-green-600",
  MPESA: "text-blue-600",
  CARD: "text-purple-600",
};

export const DailyStatsBanner = () => {
  const { data, isLoading } = useDailyStats();
  const qc = useQueryClient();
  const s = data?.summary;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            Today&apos;s Performance
          </h2>
          <p className="text-xs text-muted-foreground">
            {data?.date ?? "Loading..."}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => qc.invalidateQueries({ queryKey: ["daily-stats"] })}
        >
          <RefreshCw size={13} />
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Revenue",
            value: `KES ${(s?.todayRevenue ?? 0).toLocaleString()}`,
            delta: s?.revDelta ?? null,
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-950/20",
          },
          {
            label: "Profit",
            value: `KES ${(s?.todayProfit ?? 0).toLocaleString()}`,
            delta: null,
            icon: TrendingUp,
            color:
              (s?.todayProfit ?? 0) >= 0 ? "text-blue-600" : "text-destructive",
            bg: "bg-blue-50 dark:bg-blue-950/20",
          },
          {
            label: "Expenses",
            value: `KES ${(s?.todayExpenses ?? 0).toLocaleString()}`,
            delta: s?.expDelta ?? null,
            icon: TrendingDown,
            color: "text-red-500",
            bg: "bg-red-50 dark:bg-red-950/20",
          },
          {
            label: "Orders",
            value: String(s?.todayOrders ?? 0),
            delta:
              s?.yestOrders != null
                ? s.yestOrders > 0
                  ? (((s?.todayOrders ?? 0) - s.yestOrders) / s.yestOrders) *
                    100
                  : null
                : null,
            icon: ShoppingCart,
            color: "text-purple-600",
            bg: "bg-purple-50 dark:bg-purple-950/20",
          },
          {
            label: "Units sold",
            value: String(s?.unitsSold ?? 0),
            delta: null,
            icon: Package,
            color: "text-teal-600",
            bg: "bg-teal-50 dark:bg-teal-950/20",
          },
          {
            label: "Avg order",
            value: `KES ${(s?.avgOrderValue ?? 0).toFixed(0)}`,
            delta: null,
            icon: Users,
            color: "text-orange-600",
            bg: "bg-orange-50 dark:bg-orange-950/20",
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-0 bg-muted/30">
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-1">
                <p
                  className="text-[10px] text-muted-foreground uppercase
                               tracking-wide"
                >
                  {kpi.label}
                </p>
                <div className={`p-1 rounded-md ${kpi.bg}`}>
                  <kpi.icon size={11} className={kpi.color} />
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-5 w-16 mt-1" />
              ) : (
                <p className="text-base font-bold leading-tight">{kpi.value}</p>
              )}
              {!isLoading && <Delta value={kpi.delta} />}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom row: hourly chart + payment methods + top products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hourly orders chart */}
        <div className="lg:col-span-2">
          <Card className="border-0 bg-muted/30">
            <CardContent className="p-4">
              <p className="text-xs font-semibold mb-3">
                Orders by hour (today)
              </p>
              {isLoading ? (
                <Skeleton className="h-32 rounded" />
              ) : (data?.hourlyBreakdown ?? []).every((h) => h.orders === 0) ? (
                <div
                  className="h-32 flex items-center justify-center
                                text-xs text-muted-foreground"
                >
                  No orders yet today
                </div>
              ) : (
                <ChartContainer
                  config={{
                    orders: { label: "Orders", color: "#3b82f6" },
                    revenue: { label: "Revenue", color: "#22c55e" },
                  }}
                  className="h-32 w-full"
                >
                  <BarChart
                    data={data?.hourlyBreakdown}
                    margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--border)"
                      opacity={0.4}
                    />
                    <XAxis
                      dataKey="hour"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                      interval={1}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                      width={24}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) =>
                            name === "revenue"
                              ? `KES ${Number(value).toLocaleString()}`
                              : `${value} orders`
                          }
                        />
                      }
                    />
                    <Bar
                      dataKey="orders"
                      fill="#3b82f6"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={20}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment methods + pending + top products */}
        <div className="space-y-3">
          {/* Payment methods */}
          <Card className="border-0 bg-muted/30">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold">Payment methods today</p>
              {isLoading ? (
                <Skeleton className="h-16 rounded" />
              ) : (
                Object.entries(data?.methodBreakdown ?? {}).map(([m, v]) => {
                  const Icon = METHOD_ICONS[m] ?? Banknote;
                  return v.count > 0 ? (
                    <div
                      key={m}
                      className="flex items-center justify-between text-xs"
                    >
                      <div
                        className={`flex items-center gap-1.5 ${METHOD_COLORS[m] ?? ""}`}
                      >
                        <Icon size={12} />
                        <span>
                          {m === "MPESA"
                            ? "M-Pesa"
                            : m.charAt(0) + m.slice(1).toLowerCase()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">
                          KES {v.amount.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground ml-1.5">
                          ({v.count})
                        </span>
                      </div>
                    </div>
                  ) : null;
                })
              )}
              {s?.pendingOrders != null && s.pendingOrders > 0 && (
                <div
                  className="flex items-center justify-between text-xs
                                pt-2 border-t"
                >
                  <span className="text-orange-500 flex items-center gap-1">
                    <Clock size={11} /> Pending
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {s.pendingOrders} orders
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top 3 products today */}
          <Card className="border-0 bg-muted/30">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold">Top products today</p>
              {isLoading ? (
                <Skeleton className="h-16 rounded" />
              ) : (data?.topProductsToday ?? []).length === 0 ? (
                <p className="text-[10px] text-muted-foreground">
                  No sales yet
                </p>
              ) : (
                data?.topProductsToday.slice(0, 3).map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between
                                             text-xs gap-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-muted-foreground w-3 shrink-0">
                        {i + 1}.
                      </span>
                      <span className="truncate">{p.name}</span>
                    </div>
                    <span className="font-medium shrink-0">{p.units} sold</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cashier performance today */}
      {(data?.cashierPerformanceToday ?? []).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {data?.cashierPerformanceToday.map((c, i) => (
            <Card key={c.name} className="border-0 bg-muted/30">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] text-muted-foreground">
                    #{i + 1}
                  </span>
                  <p className="text-xs font-medium truncate">{c.name}</p>
                </div>
                <p className="text-sm font-bold text-green-600">
                  KES {c.revenue.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {c.orders} order{c.orders !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
