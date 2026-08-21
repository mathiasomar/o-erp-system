"use client";

import { useState, useTransition } from "react";
import { voidReceipt } from "@/actions/receipt.action";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  receiptId: string;
  receiptNumber: string;
  total: number;
};

export const VoidReceiptDialog = ({
  open,
  onClose,
  receiptId,
  receiptNumber,
  total,
}: Props) => {
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleVoid = () => {
    if (!reason.trim()) {
      toast.error("Please provide a void reason");
      return;
    }
    startTransition(async () => {
      const result = await voidReceipt(receiptId, reason.trim());
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["receipts"] });
        qc.invalidateQueries({ queryKey: ["orders"] });
        qc.invalidateQueries({ queryKey: ["inventory"] });
        toast.success(`Receipt ${receiptNumber} voided — stock returned`);
        setReason("");
        onClose();
      } else {
        toast.error(result.error ?? "Failed to void receipt");
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-destructive" />
            Void Receipt {receiptNumber}?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-1">
            <span className="block">
              This will void the receipt and linked order, and return all items
              to inventory.
            </span>
            <span className="block text-destructive font-medium">
              KES {total.toLocaleString()} will be removed from completed
              revenue.
            </span>
            <span className="block">This cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="void-reason">
            Reason <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="void-reason"
            placeholder="e.g. Customer returned goods, wrong items on receipt..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isPending || !reason.trim()}
            onClick={handleVoid}
          >
            {isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
            {isPending ? "Voiding..." : "Void & return stock"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
