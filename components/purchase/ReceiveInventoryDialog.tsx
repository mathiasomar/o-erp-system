"use client";

import { useState, useTransition } from "react";
import { receiveInventory } from "@/actions/purchase.action";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PackageCheck, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PurchaseItem = {
  id: string;
  productName: string;
  sku: string;
  orderedQty: number;
  receivedQty: number;
  unitCostExcl: number;
  unitCostIncl: number;
  taxRate: number;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
};

type Props = {
  open: boolean;
  onClose: () => void;
  purchaseId: string;
  purchaseNumber: string;
  items: PurchaseItem[];
};

export const ReceiveInventoryDialog = ({
  open,
  onClose,
  purchaseId,
  purchaseNumber,
  items,
}: Props) => {
  const qc = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [notes, setNotes] = useState("");

  // Per-item receive quantities (default to remaining)
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      items.map((i) => [i.id, Math.max(0, i.orderedQty - i.receivedQty)]),
    ),
  );

  const pendingItems = items.filter((i) => i.receivedQty < i.orderedQty);

  const handleSubmit = () => {
    const receiveItems = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([purchaseItemId, receivedQty]) => ({
        purchaseItemId,
        receivedQty,
      }));

    if (receiveItems.length === 0) {
      toast.error("Enter at least one quantity to receive");
      return;
    }

    startTransition(async () => {
      const result = await receiveInventory({
        purchaseId,
        items: receiveItems,
        invoiceNumber: invoiceNumber || undefined,
        invoiceDate: invoiceDate || undefined,
        notes: notes || undefined,
      });

      if (result.success) {
        qc.invalidateQueries({ queryKey: ["purchases"] });
        qc.invalidateQueries({ queryKey: ["inventory"] });
        qc.invalidateQueries({ queryKey: ["products"] });
        toast.success("Inventory received and stock updated");
        onClose();
      } else {
        toast.error(
          typeof result.error === "string"
            ? result.error
            : "Failed to receive inventory",
        );
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh]
                                flex flex-col gap-0 p-0"
      >
        <DialogHeader className="px-6 pt-5 pb-4 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck size={18} className="text-primary" />
            Receive Inventory
          </DialogTitle>
          <DialogDescription>
            {purchaseNumber} — enter quantities received per item. Stock will be
            updated immediately.
          </DialogDescription>
        </DialogHeader>

        <Separator className="shrink-0" />

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4 overflow-y-auto">
          {/* Invoice details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="inv-num">Invoice number</Label>
              <Input
                id="inv-num"
                placeholder="e.g. INV-2024-001"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-date">Invoice date</Label>
              <Input
                id="inv-date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
          </div>

          {/* Items table */}
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {[
                    "Product",
                    "Ordered",
                    "Received",
                    "Receive now",
                    "Cost (excl)",
                    "Cost (incl)",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-xs font-medium
                                 text-muted-foreground whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const remaining = item.orderedQty - item.receivedQty;
                  const isDone = remaining <= 0;
                  return (
                    <tr
                      key={item.id}
                      className={cn("border-t", isDone && "opacity-50")}
                    >
                      <td className="px-3 py-2">
                        <p className="font-medium">{item.product?.name || item.productName}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {item.product?.sku || item.sku}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {item.orderedQty}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={item.receivedQty > 0 ? "default" : "outline"}
                          className="text-[10px]"
                        >
                          {item.receivedQty}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          max={remaining}
                          disabled={isDone}
                          value={quantities[item.id] ?? 0}
                          onChange={(e) =>
                            setQuantities((prev) => ({
                              ...prev,
                              [item.id]: Math.min(
                                remaining,
                                Math.max(0, parseInt(e.target.value) || 0),
                              ),
                            }))
                          }
                          className="h-7 w-20 text-center text-xs"
                        />
                        {!isDone && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            max {remaining}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-xs">
                        KES {item.unitCostExcl.toLocaleString()}
                        {item.taxRate > 0 && (
                          <p className="text-muted-foreground text-[10px]">
                            +{item.taxRate}% VAT
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-medium">
                        KES {item.unitCostIncl.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="rcv-notes">Notes (optional)</Label>
            <Input
              id="rcv-notes"
              placeholder="e.g. Some items damaged on arrival..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {pendingItems.length === 0 && (
            <div
              className="flex items-center gap-2 text-sm
                            text-muted-foreground py-2"
            >
              <AlertTriangle size={14} className="text-orange-500" />
              All items have been fully received
            </div>
          )}
        </div>

        <Separator className="shrink-0" />

        <DialogFooter className="px-6 py-4 shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={isPending || pendingItems.length === 0}
            onClick={handleSubmit}
          >
            {isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
            {isPending ? "Receiving…" : "Receive inventory"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
