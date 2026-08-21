"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateDiscount } from "@/actions/product.action";

type Props = {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
};

export function DiscountModal({ open, onClose, selectedIds }: Props) {
  const [rate, setRate] = useState("");
  const [pending, startTrans] = useTransition();
  const qc = useQueryClient();

  async function handleApply() {
    const parsed = parseFloat(rate);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      toast.error("Enter a valid discount between 0 and 100");
      return;
    }
    startTrans(async () => {
      await updateDiscount(selectedIds, parsed);
      qc.invalidateQueries({ queryKey: ["products-all"] });
      toast.success(
        `Discount of ${parsed}% applied to ${selectedIds.length} product(s)`,
      );
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Apply Discount Rate</DialogTitle>
          <DialogDescription>
            Set a discount percentage that will be applied to selected products.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Applying to <strong>{selectedIds.length}</strong> product(s).
          </p>
          <div className="space-y-1">
            <Label htmlFor="discount">Discount (%)</Label>
            <Input
              id="discount"
              type="number"
              min={0}
              max={100}
              placeholder="e.g. 10"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={pending}>
            {pending ? "Applying..." : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
