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
import { TrendingUp } from "lucide-react";

type Props = {
  data: {
    date: string;
    revenue: number;
    expenses: number;
    costOfGoods: number;
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
    grossMargin: number;
  }[];
  loading: boolean;
};

const config: ChartConfig = {
  revenue: { label: "Revenue", color: "var(--trend-revenue)" },
  expenses: { label: "Expenses", color: "var(--trend-expenses)" },
  costOfGoods: { label: "COGS", color: "var(--trend-cogs)" },
  grossProfit: { label: "Gross Profit", color: "var(--trend-gross-profit)" },
  netProfit: { label: "Net Profit", color: "var(--trend-net-profit)" },
};

export const TrendChart = ({ data, loading }: Props) => (
  <>
    <style>{`
      .trend-chart {
        --trend-revenue:  #22c55e;
        --trend-expenses: #f87171;
        --trend-cogs: #f97316;
        --trend-gross-profit: #8b5cf6;
        --trend-net-profit: #06b6d4;
      }
      .dark .trend-chart {
        --trend-revenue:  #4ade80;
        --trend-expenses: #fca5a5;
        --trend-cogs: #fb923c;
        --trend-gross-profit: #a78bfa;
        --trend-net-profit: #22d3ee;
      }
    `}</style>
    <Card className="trend-chart">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp size={16} className="text-green-500" />
          Revenue, Expenses & Profit Trends
        </CardTitle>
        <CardDescription>
          Daily/monthly trend for selected period with profit breakdown
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No data available for the selected period
          </div>
        ) : (
          <ChartContainer config={config} className="h-64 w-full">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                {(
                  [
                    "revenue",
                    "expenses",
                    "costOfGoods",
                    "grossProfit",
                    "netProfit",
                  ] as const
                ).map((key) => (
                  <linearGradient
                    key={key}
                    id={`fill-${key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={`var(--trend-${key})`}
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor={`var(--trend-${key})`}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
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
                width={42}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      if (name === "profitMargin" || name === "grossMargin") {
                        return `${Number(value).toFixed(1)}%`;
                      }
                      return `KES ${Number(value).toLocaleString()}`;
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              {(
                [
                  "revenue",
                  "expenses",
                  "costOfGoods",
                  "grossProfit",
                  "netProfit",
                ] as const
              ).map((key) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={`var(--trend-${key})`}
                  strokeWidth={key === "netProfit" ? 2.5 : 2}
                  fill={`url(#fill-${key})`}
                  dot={false}
                  activeDot={{
                    r: 4,
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                />
              ))}
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  </>
);
