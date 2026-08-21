"use client";

import { InventoryItem } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  Package,
  RotateCcw,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useStockLogs } from "@/hooks/use-inventory";

const reasonConfig: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    color: string;
  }
> = {
  RESTOCK: { label: "Restock", icon: Package, color: "text-green-600" },
  MANUAL_INCREASE: {
    label: "Manual increase",
    icon: TrendingUp,
    color: "text-blue-600",
  },
  MANUAL_DECREASE: {
    label: "Manual decrease",
    icon: TrendingDown,
    color: "text-orange-500",
  },
  DAMAGED: { label: "Damaged", icon: AlertTriangle, color: "text-destructive" },
  RETURNED: { label: "Returned", icon: RotateCcw, color: "text-purple-600" },
  EXPIRED: { label: "Expired", icon: Clock, color: "text-muted-foreground" },
};

type Props = {
  open: boolean;
  onClose: () => void;
  item: InventoryItem;
};

export const StockLogSheet = ({ open, onClose, item }: Props) => {
  const { data: logs = [], isLoading } = useStockLogs(
    open ? item.productId : "",
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-4">
        <SheetHeader className="mb-4">
          <SheetTitle>Stock History</SheetTitle>
          <SheetDescription>
            Last 50 adjustments for{" "}
            <span className="font-medium text-foreground">
              {item.product.name}
            </span>
          </SheetDescription>
        </SheetHeader>

        <Separator className="mb-4" />

        {/* Current stock */}
        <div
          className="flex items-center justify-between p-3 rounded-lg
                        border bg-muted/40 mb-6 text-sm"
        >
          <span className="text-muted-foreground">Current stock</span>
          <span className="font-bold text-lg">{item.quantity} units</span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm mt-12">
            No stock adjustments recorded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const rc =
                reasonConfig[log.reason] ?? reasonConfig.MANUAL_DECREASE;
              const Icon = rc.icon;
              const isPlus = log.change > 0;

              return (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-3
                             rounded-lg border bg-muted/20 gap-3"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-0.5 shrink-0 ${rc.color}`}>
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-medium">{rc.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.quantityBefore} → {log.quantityAfter} units
                      </p>
                      {log.note && (
                        <p className="text-xs text-muted-foreground italic truncate">
                          {log.note}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm")}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={isPlus ? "default" : "destructive"}
                    className="shrink-0 text-xs"
                  >
                    {isPlus ? `+${log.change}` : log.change}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
