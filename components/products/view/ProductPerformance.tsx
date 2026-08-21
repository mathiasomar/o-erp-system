// src/components/products/view/PerformanceChart.tsx

"use client";

import { useState } from "react";
import { PerformanceRange } from "@/lib/api/products";
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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { useProductPerformance } from "@/hooks/use-product";

const chartConfig: ChartConfig = {
  revenue: {
    label: "Revenue (KES)",
    color: "var(--perf-revenue-color)",
  },
  units: {
    label: "Units sold",
    color: "var(--perf-units-color)",
  },
};

const RANGES: { label: string; value: PerformanceRange }[] = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "3m", value: "3m" },
  { label: "1y", value: "1y" },
];

type Props = { productId: string };

export const PerformanceChart = ({ productId }: Props) => {
  const [range, setRange] = useState<PerformanceRange>("30d");
  const { data, isLoading } = useProductPerformance(productId, range);

  return (
    <>
      <style>{`
        .perf-chart-wrapper {
          --perf-revenue-color:          #3b82f6;
          --perf-revenue-start:          rgba(59,130,246,0.20);
          --perf-revenue-end:            rgba(59,130,246,0);
          --perf-units-color:            #8b5cf6;
          --perf-units-start:            rgba(139,92,246,0.15);
          --perf-units-end:              rgba(139,92,246,0);
        }
        .dark .perf-chart-wrapper {
          --perf-revenue-color:          #60a5fa;
          --perf-revenue-start:          rgba(96,165,250,0.18);
          --perf-revenue-end:            rgba(96,165,250,0);
          --perf-units-color:            #a78bfa;
          --perf-units-start:            rgba(167,139,250,0.15);
          --perf-units-end:              rgba(167,139,250,0);
        }
      `}</style>

      <Card className="perf-chart-wrapper h-full">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp size={16} className="text-blue-500" />
                Sales Performance
              </CardTitle>
              <CardDescription>
                Revenue and units sold over time
              </CardDescription>
            </div>

            {/* Summary badges */}
            {data && !isLoading && (
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  KES {data.totalRevenue.toLocaleString()}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {data.totalUnits} units
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {data.totalOrders} orders
                </Badge>
              </div>
            )}
          </div>

          {/* Range tabs */}
          <Tabs
            value={range}
            onValueChange={(v) => setRange(v as PerformanceRange)}
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
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : !data ||
            data.chartData.every((d) => d.revenue === 0 && d.units === 0) ? (
            <div
              className="h-64 flex flex-col items-center justify-center
                            gap-2 text-center rounded-lg border-2 border-dashed
                            border-muted-foreground/20"
            >
              <TrendingUp size={28} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No sales in this period
              </p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <AreaChart
                data={data.chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="perfRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--perf-revenue-start)"
                      stopOpacity={1}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--perf-revenue-end)"
                      stopOpacity={1}
                    />
                  </linearGradient>
                  <linearGradient id="perfUnits" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--perf-units-start)"
                      stopOpacity={1}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--perf-units-end)"
                      stopOpacity={1}
                    />
                  </linearGradient>
                </defs>
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
                  yAxisId="revenue"
                  orientation="left"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                  width={42}
                />
                <YAxis
                  yAxisId="units"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  width={30}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) =>
                        name === "revenue"
                          ? `KES ${Number(value).toLocaleString()}`
                          : `${value} units`
                      }
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--perf-revenue-color)"
                  strokeWidth={2}
                  fill="url(#perfRevenue)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "var(--perf-revenue-color)",
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                />
                <Area
                  yAxisId="units"
                  type="monotone"
                  dataKey="units"
                  stroke="var(--perf-units-color)"
                  strokeWidth={2}
                  fill="url(#perfUnits)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "var(--perf-units-color)",
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </>
  );
};
