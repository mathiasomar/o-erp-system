"use client";

import { useState } from "react";
import { ActivityLogRow } from "@/components/activity/ActivityLogRow";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, ShoppingCart, TrendingUp } from "lucide-react";
import { ActivityRange } from "@/lib/api/user";
import { useUserActivity } from "@/hooks/use-user";

const chartConfig: ChartConfig = {
  orders: {
    label: "Orders",
    color: "var(--activity-orders-color)",
  },
  revenue: {
    label: "Revenue (KES)",
    color: "var(--activity-revenue-color)",
  },
  activities: {
    label: "Activities",
    color: "var(--activity-actions-color)",
  },
};

const RANGES: { label: string; value: ActivityRange }[] = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "3 months", value: "3m" },
];

type Props = { userId: string };

export const UserActivityChart = ({ userId }: Props) => {
  const [range, setRange] = useState<ActivityRange>("30d");
  const { data, isLoading } = useUserActivity(userId, range);

  return (
    <>
      <style>{`
        .activity-chart-wrapper {
          --activity-orders-color:  #3b82f6;
          --activity-revenue-color: #22c55e;
          --activity-actions-color: #8b5cf6;
        }
        .dark .activity-chart-wrapper {
          --activity-orders-color:  #60a5fa;
          --activity-revenue-color: #4ade80;
          --activity-actions-color: #a78bfa;
        }
      `}</style>

      <div className="space-y-4 activity-chart-wrapper">
        {/* Summary badges */}
        {data && !isLoading && (
          <div className="flex gap-3 flex-wrap">
            <div
              className="flex items-center gap-1.5 rounded-lg border
                            px-3 py-2 text-sm"
            >
              <ShoppingCart size={13} className="text-blue-500" />
              <span className="font-semibold">{data.totalOrders}</span>
              <span className="text-muted-foreground">orders</span>
            </div>
            <div
              className="flex items-center gap-1.5 rounded-lg border
                            px-3 py-2 text-sm"
            >
              <TrendingUp size={13} className="text-green-500" />
              <span className="font-semibold">
                KES {data.totalRevenue.toLocaleString()}
              </span>
              <span className="text-muted-foreground">revenue</span>
            </div>
            <div
              className="flex items-center gap-1.5 rounded-lg border
                            px-3 py-2 text-sm"
            >
              <Activity size={13} className="text-purple-500" />
              <span className="font-semibold">{data.totalActivities}</span>
              <span className="text-muted-foreground">actions</span>
            </div>
          </div>
        )}

        <Tabs defaultValue="chart">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <TabsList>
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <Tabs
              value={range}
              onValueChange={(v) => setRange(v as ActivityRange)}
            >
              <TabsList className="h-7">
                {RANGES.map((r) => (
                  <TabsTrigger
                    key={r.value}
                    value={r.value}
                    className="text-xs px-3"
                  >
                    {r.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Chart tab */}
          <TabsContent value="chart" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity over time</CardTitle>
                <CardDescription>
                  Orders, revenue and total actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-56 rounded-lg" />
                ) : !data ||
                  data.chartData.every(
                    (d) => d.orders === 0 && d.activities === 0,
                  ) ? (
                  <div
                    className="h-56 flex flex-col items-center
                                  justify-center gap-2 rounded-lg
                                  border-2 border-dashed
                                  border-muted-foreground/20"
                  >
                    <Activity size={24} className="text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      No activity in this period
                    </p>
                  </div>
                ) : (
                  <ChartContainer config={chartConfig} className="h-56 w-full">
                    <BarChart
                      data={data.chartData}
                      margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--border)"
                        opacity={0.5}
                      />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        tickMargin={8}
                      />
                      <YAxis
                        yAxisId="orders"
                        orientation="left"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        width={30}
                      />
                      <YAxis
                        yAxisId="revenue"
                        orientation="right"
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
                            formatter={(value, name) =>
                              name === "revenue"
                                ? `KES ${Number(value).toLocaleString()}`
                                : `${value}`
                            }
                          />
                        }
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar
                        yAxisId="orders"
                        dataKey="orders"
                        fill="var(--activity-orders-color)"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={28}
                      />
                      <Bar
                        yAxisId="revenue"
                        dataKey="revenue"
                        fill="var(--activity-revenue-color)"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={28}
                      />
                      <Bar
                        yAxisId="orders"
                        dataKey="activities"
                        fill="var(--activity-actions-color)"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={28}
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline tab */}
          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent activity</CardTitle>
                <CardDescription>Last 10 actions by this user</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 rounded-lg" />
                    ))}
                  </div>
                ) : (data?.recentActivity ?? []).length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center
                                  h-32 gap-2 text-muted-foreground text-sm"
                  >
                    <Activity size={24} className="opacity-30" />
                    No recent activity
                  </div>
                ) : (
                  <ScrollArea className="max-h-80">
                    {data?.recentActivity.map((log) => (
                      <ActivityLogRow key={log.id} log={log} compact />
                    ))}
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};
