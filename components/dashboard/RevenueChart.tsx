"use client";

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
import { Skeleton } from "@/components/ui/skeleton";

type ChartRow = {
  date: string;
  revenue: number;
  expenses: number;
  costOfGoods: number;
  grossProfit: number;
  netProfit: number;
  profitLoss: number;
  margin: number;
};

type Props = {
  data: ChartRow[];
  loading: boolean;
};

const chartConfig: ChartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--dashboard-revenue-color)",
  },
  expenses: {
    label: "Expenses",
    color: "var(--dashboard-expenses-color)",
  },
  costOfGoods: {
    label: "COGS",
    color: "var(--dashboard-cogs-color)",
  },
  grossProfit: {
    label: "Gross Profit",
    color: "var(--dashboard-gross-profit-color)",
  },
  netProfit: {
    label: "Net Profit",
    color: "var(--dashboard-net-profit-color)",
  },
  margin: {
    label: "Profit Margin",
    color: "var(--dashboard-margin-color)",
  },
};

export const RevenueChart = ({ data, loading }: Props) => {
  return (
    <>
      <style>{`
        .revenue-chart-wrapper {
          --dashboard-revenue-color:          #22c55e;
          --dashboard-revenue-gradient-start: rgba(34,197,94,0.20);
          --dashboard-revenue-gradient-end:   rgba(34,197,94,0);
          --dashboard-expenses-color:          #f87171;
          --dashboard-expenses-gradient-start: rgba(248,113,113,0.15);
          --dashboard-expenses-gradient-end:   rgba(248,113,113,0);
          --dashboard-cogs-color:              #f97316;
          --dashboard-cogs-gradient-start:     rgba(249,115,22,0.15);
          --dashboard-cogs-gradient-end:       rgba(249,115,22,0);
          --dashboard-gross-profit-color:      #8b5cf6;
          --dashboard-gross-profit-gradient-start: rgba(139,92,246,0.15);
          --dashboard-gross-profit-gradient-end:   rgba(139,92,246,0);
          --dashboard-net-profit-color:        #06b6d4;
          --dashboard-net-profit-gradient-start: rgba(6,182,212,0.15);
          --dashboard-net-profit-gradient-end:   rgba(6,182,212,0);
          --dashboard-margin-color:            #f59e0b;
        }
        .dark .revenue-chart-wrapper {
          --dashboard-revenue-color:          #4ade80;
          --dashboard-revenue-gradient-start: rgba(74,222,128,0.18);
          --dashboard-revenue-gradient-end:   rgba(74,222,128,0);
          --dashboard-expenses-color:          #fca5a5;
          --dashboard-expenses-gradient-start: rgba(252,165,165,0.15);
          --dashboard-expenses-gradient-end:   rgba(252,165,165,0);
          --dashboard-cogs-color:              #fb923c;
          --dashboard-cogs-gradient-start:     rgba(251,146,60,0.15);
          --dashboard-cogs-gradient-end:       rgba(251,146,60,0);
          --dashboard-gross-profit-color:      #a78bfa;
          --dashboard-gross-profit-gradient-start: rgba(167,139,250,0.15);
          --dashboard-gross-profit-gradient-end:   rgba(167,139,250,0);
          --dashboard-net-profit-color:        #22d3ee;
          --dashboard-net-profit-gradient-start: rgba(34,211,238,0.15);
          --dashboard-net-profit-gradient-end:   rgba(34,211,238,0);
          --dashboard-margin-color:            #fbbf24;
        }
      `}</style>
      <Card className="revenue-chart-wrapper">
        <CardHeader>
          <CardTitle className="text-base">
            Revenue vs Expenses & Profit
          </CardTitle>
          <CardDescription>
            Daily comparison for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--dashboard-revenue-gradient-start)"
                      stopOpacity={1}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--dashboard-revenue-gradient-end)"
                      stopOpacity={1}
                    />
                  </linearGradient>
                  <linearGradient
                    id="expensesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--dashboard-expenses-gradient-start)"
                      stopOpacity={1}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--dashboard-expenses-gradient-end)"
                      stopOpacity={1}
                    />
                  </linearGradient>
                  <linearGradient id="cogsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--dashboard-cogs-gradient-start)"
                      stopOpacity={1}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--dashboard-cogs-gradient-end)"
                      stopOpacity={1}
                    />
                  </linearGradient>
                  <linearGradient
                    id="grossProfitGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--dashboard-gross-profit-gradient-start)"
                      stopOpacity={1}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--dashboard-gross-profit-gradient-end)"
                      stopOpacity={1}
                    />
                  </linearGradient>
                  <linearGradient
                    id="netProfitGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--dashboard-net-profit-gradient-start)"
                      stopOpacity={1}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--dashboard-net-profit-gradient-end)"
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
                      formatter={(value, name) => {
                        // Special formatting for margin
                        if (name === "margin") {
                          return `${Number(value).toFixed(1)}%`;
                        }
                        return `KES ${Number(value).toLocaleString()}`;
                      }}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />

                {/* Revenue Area */}
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--dashboard-revenue-color)"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "var(--dashboard-revenue-color)",
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                />

                {/* COGS Area */}
                <Area
                  type="monotone"
                  dataKey="costOfGoods"
                  stroke="var(--dashboard-cogs-color)"
                  strokeWidth={2}
                  fill="url(#cogsGradient)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "var(--dashboard-cogs-color)",
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                />

                {/* Expenses Area */}
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="var(--dashboard-expenses-color)"
                  strokeWidth={2}
                  fill="url(#expensesGradient)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "var(--dashboard-expenses-color)",
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                />

                {/* Gross Profit Area */}
                <Area
                  type="monotone"
                  dataKey="grossProfit"
                  stroke="var(--dashboard-gross-profit-color)"
                  strokeWidth={2}
                  fill="url(#grossProfitGradient)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "var(--dashboard-gross-profit-color)",
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                />

                {/* Net Profit Area */}
                <Area
                  type="monotone"
                  dataKey="netProfit"
                  stroke="var(--dashboard-net-profit-color)"
                  strokeWidth={2.5}
                  fill="url(#netProfitGradient)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "var(--dashboard-net-profit-color)",
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
