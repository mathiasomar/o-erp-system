import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";

type Product = {
  id: string;
  name: string;
  category: string;
  units: number;
  revenue: number;
};

type Props = { products: Product[]; loading: boolean };

const MEDAL = ["🥇", "🥈", "🥉"];

export const TopProductsTable = ({ products, loading }: Props) => {
  const maxRev = Math.max(...products.map((p) => p.revenue), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy size={16} className="text-amber-500" />
          Top 10 Products
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            No sales data
          </p>
        ) : (
          <div className="space-y-2.5">
            {products.map((p, i) => (
              <div key={p.id} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs w-6 shrink-0">
                      {MEDAL[i] ?? `#${i + 1}`}
                    </span>
                    <span className="font-medium truncate">{p.name}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {p.category}
                    </Badge>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-xs">
                      KES {p.revenue.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {p.units} units
                    </p>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(p.revenue / maxRev) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
