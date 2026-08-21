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
import { PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// ── New type — matches what the dashboard API now returns ─────────────────────
// paymentBreakdown is now Record<string, { count: number; amount: number }>
// We accept it as an array of entries for easy mapping

type BreakdownEntry = {
  method: string;
  count: number;
  amount: number;
};

type Props = {
  // Accept the Record from the API and convert, or accept pre-converted array
  data: Record<string, { count: number; amount: number }> | BreakdownEntry[];
  loading: boolean;
};

const METHOD_COLORS: Record<string, string> = {
  CASH: "#22c55e",
  MPESA: "#3b82f6",
  CARD: "#8b5cf6",
  BANK_TRANSFER: "#f97316",
};

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  MPESA: "M-Pesa",
  CARD: "Card",
  BANK_TRANSFER: "Bank transfer",
};

export const PaymentBreakdown = ({ data, loading }: Props) => {
  // Normalise both shapes — Record or array — into BreakdownEntry[]
  const entries: BreakdownEntry[] = Array.isArray(data)
    ? data
    : Object.entries(data).map(([method, v]) => ({
        method,
        count: v.count,
        amount: v.amount,
      }));

  // Filter out methods with no amount so the chart isn't cluttered
  const active = entries.filter((e) => e.amount > 0);

  const chartData = active.map((e) => ({
    name: METHOD_LABELS[e.method] ?? e.method,
    value: e.amount,
    count: e.count,
    fill: METHOD_COLORS[e.method] ?? "#6b7280",
  }));

  const config: ChartConfig = Object.fromEntries(
    chartData.map((d) => [d.name, { label: d.name, color: d.fill }]),
  );

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payment Methods</CardTitle>
        <CardDescription>Revenue split by payment type</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-48 w-full rounded-lg" />
        ) : active.length === 0 ? (
          <div
            className="flex items-center justify-center h-48
                          text-muted-foreground text-sm"
          >
            No payment data yet
          </div>
        ) : (
          <>
            <ChartContainer config={config} className="h-48 w-full">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) =>
                        `KES ${Number(value).toLocaleString()}`
                      }
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>

            {/* Summary rows below chart */}
            <div className="mt-3 space-y-1.5">
              {chartData.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: d.fill }}
                    />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="text-muted-foreground/60">
                      ({d.count} txn{d.count !== 1 ? "s" : ""})
                    </span>
                  </div>
                  <span className="font-medium">
                    KES {d.value.toLocaleString()}
                  </span>
                </div>
              ))}
              <div
                className="flex justify-between text-xs font-semibold
                              border-t pt-1.5 mt-1.5"
              >
                <span>Total</span>
                <span>KES {total.toLocaleString()}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
