"use client";

import { useState, useTransition } from "react";
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
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { voidOrder } from "@/actions/order.action";

type Props = {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  orderTotal: number;
};

export const VoidOrderDialog = ({
  open,
  onClose,
  orderId,
  orderNumber,
  orderTotal,
}: Props) => {
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleVoid = () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for voiding");
      return;
    }
    startTransition(async () => {
      const result = await voidOrder(orderId, reason.trim());
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["orders"] });
        qc.invalidateQueries({ queryKey: ["receipts"] });
        qc.invalidateQueries({ queryKey: ["inventory"] });
        toast.success(`Order ${orderNumber} voided — stock returned`);
        setReason("");
        onClose();
      } else {
        toast.error(result.error ?? "Failed to void order");
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-destructive" />
            Void {orderNumber}?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-1">
            <span className="block">
              This will mark the order as <strong>VOIDED</strong> and return all
              items back to inventory.
            </span>
            <span className="block text-destructive font-medium">
              KES {orderTotal.toLocaleString()} will be removed from completed
              revenue.
            </span>
            <span className="block">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="void-reason">
            Reason <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="void-reason"
            placeholder="e.g. Customer returned goods, wrong items sold..."
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
