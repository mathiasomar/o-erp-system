"use client";

import { useState, useTransition } from "react";
import { combineReceipts } from "@/actions/receipt.action";
import { useQueryClient } from "@tanstack/react-query";
import { Receipt } from "@/types";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combine,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Receipt as ReceiptIcon,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  receipts: Receipt[]; // all active receipts to choose from
};

export const CombineReceiptsDialog = ({ open, onClose, receipts }: Props) => {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  // Only show active, non-combined receipts
  const eligible = receipts.filter(
    (r) => r.status === "ACTIVE" && r.type !== "COMBINED",
  );

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const selectedReceipts = eligible.filter((r) => selected.includes(r.id));
  const combinedTotal = selectedReceipts.reduce((s, r) => s + r.total, 0);

  // Validate: all selected must share same customer (or all null)
  const customerIds = [...new Set(selectedReceipts.map((r) => r.customerId))];
  const customerMismatch = customerIds.length > 1;

  const canCombine = selected.length >= 2 && !customerMismatch && !isPending;

  const handleCombine = () => {
    startTransition(async () => {
      const result = await combineReceipts(selected, note || undefined);
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["receipts"] });
        toast.success(
          `Combined ${selected.length} receipts into ${result.receipt?.receiptNumber}`,
        );
        setSelected([]);
        setNote("");
        onClose();
      } else {
        toast.error(result.error ?? "Failed to combine receipts");
      }
    });
  };

  const handleClose = () => {
    setSelected([]);
    setNote("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Combine size={18} className="text-primary" />
            Combine Receipts
          </DialogTitle>
          <DialogDescription>
            Select 2 or more active receipts to merge into a single combined
            receipt. Stock is not affected — only the receipt record changes.
          </DialogDescription>
        </DialogHeader>

        <Separator className="shrink-0" />

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-3">
          {eligible.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-32
                            gap-2 text-muted-foreground text-sm"
            >
              <ReceiptIcon size={24} className="opacity-30" />
              No eligible receipts to combine
            </div>
          ) : (
            eligible.map((r) => {
              const isSelected = selected.includes(r.id);
              return (
                <label
                  key={r.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3",
                    "cursor-pointer transition-colors select-none",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggle(r.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold">
                        {r.receiptNumber}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {r.type}
                      </Badge>
                      {r.customer && (
                        <span className="text-xs text-muted-foreground">
                          {r.customer.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(r.createdAt), "dd MMM yyyy, HH:mm")}
                      </span>
                      <span>{r.items.length} items</span>
                    </div>
                  </div>
                  <span className="font-bold text-sm shrink-0">
                    KES {r.total.toLocaleString()}
                  </span>
                </label>
              );
            })
          )}
        </div>

        <Separator className="shrink-0" />

        <div className="px-6 py-4 shrink-0 space-y-3">
          {/* Validation messages */}
          {customerMismatch && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle size={13} />
              Selected receipts belong to different customers. All must share
              the same customer.
            </div>
          )}

          {/* Summary */}
          {selected.length >= 2 && !customerMismatch && (
            <div
              className="flex items-center justify-between rounded-lg
                            bg-muted/50 px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-600" />
                <span className="text-muted-foreground">
                  {selected.length} receipts selected
                </span>
              </div>
              <span className="font-bold">
                KES {combinedTotal.toLocaleString()}
              </span>
            </div>
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="combine-note">Note (optional)</Label>
            <Input
              id="combine-note"
              placeholder="e.g. Customer requested combined receipt"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <DialogFooter className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button disabled={!canCombine} onClick={handleCombine}>
              {isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
              {isPending
                ? "Combining..."
                : `Combine ${selected.length} receipts`}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
