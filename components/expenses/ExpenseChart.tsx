"use client";

import { useState } from "react";
import { ChartRange } from "@/lib/api/expenses";
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
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown } from "lucide-react";
import { useExpenseChart } from "@/hooks/use-expense";

const chartConfig: ChartConfig = {
  amount: {
    label: "Expenses (KES)",
    color: "var(--expense-chart-color)",
  },
};

const RANGES: { label: string; value: ChartRange }[] = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "3 months", value: "3m" },
  { label: "1 year", value: "1y" },
];

export function ExpenseChart() {
  const [range, setRange] = useState<ChartRange>("30d");
  const { data, isLoading } = useExpenseChart(range);

  return (
    <>
      {/*
        Scoped CSS variables for the chart color.
        Light mode  → red-400  (#f87171) — visible, warm, signals spending
        Dark mode   → red-300  (#fca5a5) — lighter so it shows on dark bg
        The gradient uses the same variable with opacity so it always
        matches the stroke and remains visible in both modes.
      */}
      <style>{`
        .expense-chart-wrapper {
          --expense-chart-color: #f87171;
          --expense-chart-gradient-start: rgba(248, 113, 113, 0.25);
          --expense-chart-gradient-end:   rgba(248, 113, 113, 0);
        }
        .dark .expense-chart-wrapper {
          --expense-chart-color: #fca5a5;
          --expense-chart-gradient-start: rgba(252, 165, 165, 0.20);
          --expense-chart-gradient-end:   rgba(252, 165, 165, 0);
        }
      `}</style>

      <Card className="expense-chart-wrapper">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDown size={16} className="text-red-400" />
                Expense trend
              </CardTitle>
              <CardDescription>
                Total spending over the selected period
              </CardDescription>
            </div>
            <Tabs
              value={range}
              onValueChange={(v) => setRange(v as ChartRange)}
            >
              <TabsList>
                {RANGES.map((r) => (
                  <TabsTrigger key={r.value} value={r.value}>
                    {r.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : !data || data.chartData.length === 0 ? (
            <div
              className="h-64 flex items-center justify-center
                            text-muted-foreground text-sm"
            >
              No expense data for this period
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <AreaChart
                data={data.chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="expenseGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--expense-chart-gradient-start)"
                      stopOpacity={1}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--expense-chart-gradient-end)"
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
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  tickMargin={8}
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
                  cursor={{
                    stroke: "var(--expense-chart-color)",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                  content={
                    <ChartTooltipContent
                      formatter={(value) =>
                        `KES ${Number(value).toLocaleString()}`
                      }
                    />
                  }
                />

                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--expense-chart-color)"
                  strokeWidth={2}
                  fill="url(#expenseGradient)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "var(--expense-chart-color)",
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
}
