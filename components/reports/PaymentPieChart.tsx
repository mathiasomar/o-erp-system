import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard } from "lucide-react";

const COLORS: Record<string, string> = {
  CASH: "#22c55e",
  MPESA: "#3b82f6",
  CARD: "#8b5cf6",
};

type Props = {
  data: Record<string, { count: number; amount: number }>;
  loading: boolean;
};

export const PaymentPieChart = ({ data, loading }: Props) => {
  const chartData = Object.entries(data).map(([method, v]) => ({
    name: method,
    value: v.amount,
    fill: COLORS[method] ?? "#6b7280",
  }));

  const config: ChartConfig = Object.fromEntries(
    chartData.map((d) => [d.name, { label: d.name, color: d.fill }]),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard size={16} />
          Payment Methods
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-48 rounded-lg" />
        ) : chartData.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            No payment data
          </p>
        ) : (
          <ChartContainer config={config} className="h-48 w-full">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(v) => `KES ${Number(v).toLocaleString()}`}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};
