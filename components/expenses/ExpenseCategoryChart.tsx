"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { PieChart as PieIcon } from "lucide-react";

type Props = {
  byCategory: Record<string, number>;
};

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#f97316",
  "#22c55e",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
];

export function ExpenseCategoryChart({ byCategory }: Props) {
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) return null;

  const chartData = entries.map(([name, value], i) => ({
    name,
    value,
    fill: COLORS[i % COLORS.length],
  }));

  const config: ChartConfig = Object.fromEntries(
    chartData.map((d) => [d.name, { label: d.name, color: d.fill }]),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PieIcon size={16} />
          By category
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-64 w-full">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) =>
                `${name} ${percent ? (percent * 100).toFixed(0) : ""}%`
              }
              labelLine={false}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `KES ${Number(value).toLocaleString()}`}
                />
              }
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
