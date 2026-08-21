import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  trend?: { value: number; label: string };
  loading?: boolean;
};

export const KpiCard = ({
  label,
  value,
  sub,
  icon: Icon,
  iconBg = "bg-muted",
  iconColor = "text-foreground",
  trend,
  loading,
}: Props) => {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p
              className="text-xs text-muted-foreground font-medium uppercase
                          tracking-wide truncate"
            >
              {label}
            </p>
            {loading ? (
              <div className="h-7 w-28 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold leading-tight tracking-tight">
                {value}
              </p>
            )}
            {sub && !loading && (
              <p className="text-xs text-muted-foreground">{sub}</p>
            )}
            {trend && !loading && (
              <p
                className={cn(
                  "text-xs font-medium",
                  trend.value >= 0 ? "text-green-600" : "text-destructive",
                )}
              >
                {trend.value >= 0 ? "▲" : "▼"}{" "}
                {Math.abs(trend.value).toFixed(1)}% {trend.label}
              </p>
            )}
          </div>
          <div className={cn("p-2.5 rounded-xl shrink-0", iconBg)}>
            <Icon size={20} className={iconColor} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
