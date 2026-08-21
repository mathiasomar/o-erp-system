import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Smartphone, CheckCircle2, Clock, XCircle } from "lucide-react";

type MpesaStat = {
  status: string;
  _count: { id: number };
  _sum: { amount: number | null };
};

type Props = { data: MpesaStat[]; loading: boolean };

const statusConfig = {
  SUCCESS: {
    label: "Successful",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/20",
    variant: "default" as const,
  },
  PENDING: {
    label: "Pending",
    icon: Clock,
    color: "text-muted-foreground",
    bg: "bg-muted/40",
    variant: "secondary" as const,
  },
  FAILED: {
    label: "Failed",
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/5",
    variant: "destructive" as const,
  },
};

export const MpesaSummary = ({ data, loading }: Props) => {
  const total = data.reduce((s, d) => s + d._count.id, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Smartphone size={15} className="text-blue-500" />
          M-Pesa Summary
        </CardTitle>
        <CardDescription>
          All-time STK Push breakdown · {total} total
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div
            className="flex items-center justify-center h-24
                          text-muted-foreground text-sm"
          >
            No M-Pesa activity yet
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((stat) => {
              const cfg =
                statusConfig[stat.status as keyof typeof statusConfig];
              if (!cfg) return null;
              const Icon = cfg.icon;
              const pct =
                total > 0 ? Math.round((stat._count.id / total) * 100) : 0;
              return (
                <div
                  key={stat.status}
                  className={`flex items-center justify-between
                    p-3 rounded-lg ${cfg.bg}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={15} className={cfg.color} />
                    <div>
                      <p className="text-sm font-medium">{cfg.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {pct}% of all requests
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={cfg.variant} className="mb-1">
                      {stat._count.id}
                    </Badge>
                    {stat._sum.amount !== null && stat._sum.amount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        KES {stat._sum.amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
