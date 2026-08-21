"use client";

import { useState } from "react";
import { Product } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, SlidersHorizontal, History } from "lucide-react";
import { format } from "date-fns";
import { useInventory } from "@/hooks/use-inventory";
import { AdjustStockSheet } from "@/components/inventory/AdjustStockSheet";
import { StockLogSheet } from "@/components/inventory/StockLogSheet";
import { PerformanceChart } from "./ProductPerformance";
import { usePermissions } from "@/hooks/use-permissions";

type Props = { product: Product };

export function StockCard({ product }: Props) {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const { can } = usePermissions();

  const { data: inventory = [], isLoading } = useInventory();
  const item = inventory.find((i) => i.productId === product.id);

  const qty = item?.quantity ?? product.stock?.quantity ?? 0;
  const lowAt = item?.lowStockAt ?? product.stock?.lowStockAt ?? 10;
  const isEmpty = qty === 0;
  const isLow = qty > 0 && qty <= lowAt;

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package size={16} /> Stock Management
            </CardTitle>
            <div className="flex gap-1">
              {can("inventory.adjust") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogOpen(true)}
                  disabled={!item}
                >
                  <History size={13} className="mr-1.5" /> History
                </Button>
              )}
              {can("inventory.adjust") && (
                <Button
                  size="sm"
                  onClick={() => setAdjustOpen(true)}
                  disabled={!item}
                >
                  <SlidersHorizontal size={13} className="mr-1.5" /> Adjust
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
            </div>
          ) : (
            <>
              {/* Big stock number */}
              <div
                className={`rounded-lg border p-6 text-center space-y-1
                ${
                  isEmpty
                    ? "border-destructive/30 bg-destructive/5"
                    : isLow
                      ? "border-orange-300/50 bg-orange-50/50 dark:bg-orange-950/20"
                      : "border-green-300/50 bg-green-50/50 dark:bg-green-950/20"
                }`}
              >
                <p
                  className={`text-4xl font-bold
                  ${
                    isEmpty
                      ? "text-destructive"
                      : isLow
                        ? "text-orange-500"
                        : "text-green-600"
                  }`}
                >
                  {qty}
                </p>
                <p className="text-sm text-muted-foreground">units in stock</p>
                <Badge
                  variant={
                    isEmpty ? "destructive" : isLow ? "outline" : "secondary"
                  }
                  className={
                    isLow && !isEmpty ? "border-orange-400 text-orange-600" : ""
                  }
                >
                  {isEmpty ? "Out of stock" : isLow ? "Low stock" : "Healthy"}
                </Badge>
              </div>

              <Separator />

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Low stock alert</span>
                  <span>≤ {lowAt} units</span>
                </div>
                {item && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last updated</span>
                    <span className="text-xs">
                      {format(new Date(item.updatedAt), "dd MMM yyyy, HH:mm")}
                    </span>
                  </div>
                )}
              </div>

              {/* Performance placeholder — Phase 5 */}
              <Separator />
              <PerformanceChart productId={product.id} />
            </>
          )}
        </CardContent>
      </Card>

      {item && (
        <>
          {can("inventory.adjust") && (
            <AdjustStockSheet
              open={adjustOpen}
              onClose={() => setAdjustOpen(false)}
              item={item}
            />
          )}
          {can("inventory.log") && (
            <StockLogSheet
              open={logOpen}
              onClose={() => setLogOpen(false)}
              item={item}
            />
          )}
        </>
      )}
    </>
  );
}
