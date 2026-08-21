"use client";

import { useState } from "react";
import { InventoryItem } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Package,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { useAdjustStock, useLowStock } from "@/hooks/use-inventory";
import Link from "next/link";
import { usePermissions } from "@/hooks/use-permissions";

// ── types ─────────────────────────────────────────────────────────────────────

type QuickAdjustState = {
  open: boolean;
  qty: string;
  reason: string;
};

type AdjustingMap = Record<string, QuickAdjustState>;

const REASONS = [
  { value: "RESTOCK", label: "Restock" },
  { value: "MANUAL_INCREASE", label: "Manual increase" },
  { value: "MANUAL_DECREASE", label: "Manual decrease" },
  { value: "RETURNED", label: "Returned" },
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
};

// ── component ─────────────────────────────────────────────────────────────────

export const LowStockDialog = ({ open, onClose }: Props) => {
  const { data: items = [], isLoading } = useLowStock();
  const [adjusting, setAdjusting] = useState<AdjustingMap>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const { can } = usePermissions();

  const { mutate: adjust, isPending } = useAdjustStock();

  const outOfStock = items.filter((i) => i.quantity === 0);
  const lowStock = items.filter((i) => i.quantity > 0);

  // ── quick adjust helpers ───────────────────────────────────────────────

  const openAdjust = (productId: string) => {
    setAdjusting((prev) => ({
      ...prev,
      [productId]: { open: true, qty: "", reason: "RESTOCK" },
    }));
  };

  const closeAdjust = (productId: string) => {
    setAdjusting((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], open: false, qty: "" },
    }));
  };

  const updateAdjust = (
    productId: string,
    field: keyof Pick<QuickAdjustState, "qty" | "reason">,
    value: string,
  ) => {
    setAdjusting((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }));
  };

  const handleSubmitAdjust = (item: InventoryItem) => {
    const state = adjusting[item.productId];
    const change = parseInt(state?.qty ?? "", 10);
    if (isNaN(change) || change === 0) return;

    adjust(
      {
        productId: item.productId,
        change,
        reason: state.reason as
          | "RESTOCK"
          | "MANUAL_INCREASE"
          | "MANUAL_DECREASE"
          | "DAMAGED"
          | "RETURNED"
          | "EXPIRED",
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            setSubmitted((prev) => ({ ...prev, [item.productId]: true }));
            closeAdjust(item.productId);
            // Clear submitted indicator after 2s
            setTimeout(() => {
              setSubmitted((prev) => ({ ...prev, [item.productId]: false }));
            }, 2000);
          }
        },
      },
    );
  };

  // ── row renderer ──────────────────────────────────────────────────────

  const StockRow = ({ item }: { item: InventoryItem }) => {
    const state = adjusting[item.productId];
    const isOpen = state?.open ?? false;
    const isDone = submitted[item.productId] ?? false;
    const isEmpty = item.quantity === 0;
    const changeNum = parseInt(state?.qty ?? "", 10);
    const newQty = isNaN(changeNum) ? item.quantity : item.quantity + changeNum;
    const isInvalid = isNaN(changeNum) || changeNum === 0;
    const goesNeg = !isNaN(changeNum) && newQty < 0;

    return (
      <div
        className={`rounded-lg border p-3 space-y-3 transition-colors
        ${
          isEmpty
            ? "border-destructive/30 bg-destructive/5"
            : "border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/10"
        }`}
      >
        {/* Top row — product info + action button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={`mt-0.5 shrink-0 ${
                isEmpty ? "text-destructive" : "text-orange-500"
              }`}
            >
              {isEmpty ? <Package size={15} /> : <AlertTriangle size={15} />}
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium leading-tight truncate">
                {item.product.name}
              </p>
              <p className="text-xs font-mono text-muted-foreground">
                {item.product.sku}
              </p>
              {item.product.category && (
                <Badge
                  style={{
                    backgroundColor: item.product.category.color ?? "#6b7280",
                  }}
                  className="text-white text-[10px] px-1.5 py-0"
                >
                  {item.product.category.name}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Stock badge */}
            <Badge
              variant={isEmpty ? "destructive" : "outline"}
              className={!isEmpty ? "border-orange-400 text-orange-600" : ""}
            >
              {isEmpty ? "Out of stock" : `${item.quantity} left`}
            </Badge>

            {/* Action button */}
            {isDone ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="h-7 w-7 flex items-center justify-center
                                    rounded-md bg-green-100 dark:bg-green-900/30"
                    >
                      <CheckCircle2 size={14} className="text-green-600" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Updated!</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              can("inventory.adjust") && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isOpen ? "default" : "outline"}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          isOpen
                            ? closeAdjust(item.productId)
                            : openAdjust(item.productId)
                        }
                      >
                        {isOpen ? (
                          <RefreshCw size={13} />
                        ) : (
                          <SlidersHorizontal size={13} />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isOpen ? "Cancel" : "Quick adjust"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            )}
          </div>
        </div>

        {/* Quick adjust panel */}
        {can("inventory.adjust") && isOpen && (
          <div className="space-y-2 pt-1">
            <Separator />
            <div className="grid grid-cols-2 gap-2">
              {/* Reason */}
              <Select
                value={state.reason}
                onValueChange={(v) => updateAdjust(item.productId, "reason", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem
                      key={r.value}
                      value={r.value}
                      className="text-xs"
                    >
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Quantity input */}
              <Input
                type="number"
                placeholder="Qty change e.g. 50"
                className="h-8 text-xs"
                value={state.qty}
                onChange={(e) =>
                  updateAdjust(item.productId, "qty", e.target.value)
                }
              />
            </div>

            {/* Preview + submit */}
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                {!isNaN(changeNum) &&
                  changeNum !== 0 &&
                  (goesNeg ? (
                    <span className="text-destructive">
                      ⚠ Would go to {newQty} (below zero)
                    </span>
                  ) : (
                    <span>
                      {item.quantity}{" "}
                      <span
                        className={
                          changeNum > 0 ? "text-green-600" : "text-orange-500"
                        }
                      >
                        {changeNum > 0 ? `+${changeNum}` : changeNum}
                      </span>{" "}
                      →{" "}
                      <span
                        className={
                          newQty <= item.lowStockAt
                            ? "text-orange-500 font-medium"
                            : "text-green-600 font-medium"
                        }
                      >
                        {newQty}
                      </span>
                    </span>
                  ))}
              </div>
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={isInvalid || goesNeg || isPending}
                onClick={() => handleSubmitAdjust(item)}
              >
                {isPending ? (
                  <Loader2 size={12} className="animate-spin mr-1" />
                ) : null}
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── dialog ────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col gap-0 p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" />
              Low Stock Alert
            </DialogTitle>
            <DialogDescription>
              {outOfStock.length > 0 && (
                <span className="text-destructive font-medium">
                  {outOfStock.length} out of stock
                </span>
              )}
              {outOfStock.length > 0 && lowStock.length > 0 && (
                <span className="text-muted-foreground"> · </span>
              )}
              {lowStock.length > 0 && (
                <span className="text-orange-600 font-medium">
                  {lowStock.length} running low
                </span>
              )}{" "}
              — quick adjust here or go to inventory for full management.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Separator />

        {/* Content */}
        <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-6 py-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2
                  size={20}
                  className="animate-spin text-muted-foreground"
                />
              </div>
            ) : items.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center
                              py-12 gap-2 text-center"
              >
                <CheckCircle2 size={32} className="text-green-500" />
                <p className="font-medium text-sm">All stock levels healthy</p>
                <p className="text-xs text-muted-foreground">
                  No products need restocking right now.
                </p>
              </div>
            ) : (
              <>
                {/* Out of stock section */}
                {outOfStock.length > 0 && (
                  <div className="space-y-2">
                    <p
                      className="text-xs font-semibold text-destructive
                                  uppercase tracking-wide flex items-center gap-1"
                    >
                      <Package size={11} />
                      Out of stock ({outOfStock.length})
                    </p>
                    {outOfStock.map((item) => (
                      <StockRow key={item.id} item={item} />
                    ))}
                  </div>
                )}

                {/* Low stock section */}
                {lowStock.length > 0 && (
                  <div className="space-y-2">
                    <p
                      className="text-xs font-semibold text-orange-600
                                  uppercase tracking-wide flex items-center gap-1"
                    >
                      <AlertTriangle size={11} />
                      Running low ({lowStock.length})
                    </p>
                    {lowStock.map((item) => (
                      <StockRow key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Footer */}
        <div
          className="px-6 py-4 shrink-0 flex items-center
                        justify-between gap-3"
        >
          <p className="text-xs text-muted-foreground">
            {items.length} product{items.length !== 1 ? "s" : ""} need attention
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onClose();
                // router.push("/dashboard/inventory?filter=low");
              }}
              asChild
            >
              <Link href="/dashboard/inventory?filter=low">
                Full inventory
                <ArrowRight size={13} className="ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
