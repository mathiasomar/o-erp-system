import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  color?: string;
};

export function PaymentStatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "text-primary",
}: Props) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg bg-muted ${color}`}>
          <Icon size={20} />
        </div>
      </CardContent>
    </Card>
  );
}
