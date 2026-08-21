"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LowStockDialog } from "./LowStockDialog";
import { useLowStock } from "@/hooks/use-inventory";

export const LowStockBanner = () => {
  const { data: items = [] } = useLowStock();
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  const outOfStock = items.filter((i) => i.quantity === 0).length;
  const lowStock = items.filter((i) => i.quantity > 0).length;

  return (
    <>
      <div
        className="flex items-center justify-between gap-3 px-4 py-2.5
                      border-b border-orange-200 sticky z-2 top-30 dark:border-orange-800
                      bg-orange-50 dark:bg-orange-950 text-sm"
      >
        <div
          className="flex items-center gap-2
                        text-orange-700 dark:text-orange-400"
        >
          <AlertTriangle size={15} className="shrink-0" />
          <span>
            {outOfStock > 0 && (
              <span className="font-semibold">{outOfStock} out of stock</span>
            )}
            {outOfStock > 0 && lowStock > 0 && " · "}
            {lowStock > 0 && (
              <span className="font-semibold">{lowStock} low stock</span>
            )}{" "}
            — restock needed
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 h-7 text-xs border-orange-300
                     dark:border-orange-700 text-orange-700
                     dark:text-orange-400 hover:bg-orange-100
                     dark:hover:bg-orange-900/30"
          onClick={() => setOpen(true)}
        >
          View all
        </Button>
      </div>

      <LowStockDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
};
