import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package2 } from "lucide-react";

type TopProduct = {
  productId: string;
  productName: string;
  _sum: {
    quantity: number | null;
    total: number | null;
  };
};

type Props = { products: TopProduct[]; loading: boolean };

export const TopProducts = ({ products, loading }: Props) => {
  const maxQty = Math.max(...products.map((p) => p._sum.quantity ?? 0), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Products</CardTitle>
        <CardDescription>Best sellers in selected period</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center
                          h-32 gap-2 text-muted-foreground text-sm"
          >
            <Package2 size={24} className="opacity-30" />
            No sales data yet
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p, i) => {
              const qty = p._sum.quantity ?? 0;
              const revenue = p._sum.total ?? 0;
              const pct = Math.round((qty / maxQty) * 100);
              return (
                <div key={p.productId} className="space-y-1">
                  <div
                    className="flex items-center justify-between
                                  text-sm gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="text-xs font-bold text-muted-foreground
                                       w-4 shrink-0"
                      >
                        #{i + 1}
                      </span>
                      <span className="font-medium truncate">
                        {p.productName}
                      </span>
                    </div>
                    <div className="text-right shrink-0 space-y-0">
                      <p className="font-semibold text-xs">{qty} units</p>
                      <p className="text-xs text-muted-foreground">
                        KES {revenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full
                                 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
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
