"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CustomerPicker } from "@/components/customer/CustomerPicker";
import { CustomerSearchResult } from "@/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    amount: number;
    note?: string;
    customerId?: string;
  }) => void;
};

export function CreateLayawayDialog({ open, onClose, onCreate }: Props) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [customer, setCustomer] = useState<CustomerSearchResult | null>(null);

  function handleCreate() {
    const amt = parseFloat(amount) || 0;
    onCreate({
      amount: amt,
      note: note || undefined,
      customerId: customer?.id,
    });
    setAmount("");
    setNote("");
    setCustomer(null);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Layaway</DialogTitle>
          <DialogDescription>
            Collect a deposit and start a layaway order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <CustomerPicker value={customer} onChange={setCustomer} />

          <Field>
            <FieldLabel htmlFor="layaway-amount">
              Deposit amount (KES)
            </FieldLabel>
            <Input
              id="layaway-amount"
              type="number"
              min={0}
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="layaway-note">Note (optional)</FieldLabel>
            <Input
              id="layaway-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!(parseFloat(amount) > 0)}>
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
