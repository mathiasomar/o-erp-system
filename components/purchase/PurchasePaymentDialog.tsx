"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, CreditCard } from "lucide-react";
import { createPurchasePayment, PurchasePaymentResult } from "@/actions/purchase-payment.action";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const schema = z.object({
  purchaseId: z.string(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  method: z.enum(["CASH", "MPESA", "CARD", "BANK_TRANSFER"]),
  reference: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  purchaseId: string;
  purchaseNumber: string;
  balanceDue: number;
};

export const PurchasePaymentDialog = ({
  open,
  onClose,
  purchaseId,
  purchaseNumber,
  balanceDue,
}: Props) => {
  const qc = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      purchaseId,
      amount: balanceDue,
      method: "CASH",
      reference: null,
      note: null,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsPending(true);
    const result: PurchasePaymentResult = await createPurchasePayment(values);
    setIsPending(false);

    if (result.success) {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      toast.success("Payment recorded successfully");
      form.reset();
      onClose();
    } else {
      if (typeof result.error === "string") {
        toast.error(result.error);
      } else if (result.error && typeof result.error === "object") {
        // Handle field errors
        Object.entries(result.error).forEach(([field, errors]) => {
          if (Array.isArray(errors)) {
            form.setError(field as "amount" | "method" | "reference" | "note", { 
              message: errors[0] 
            });
          }
        });
      } else {
        toast.error("Failed to record payment");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard size={18} className="text-primary" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            {purchaseNumber} — Balance due: KES {balanceDue.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup className="space-y-4">
            <Controller
              name="amount"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="payment-amount">
                    Payment Amount (KES) <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={balanceDue}
                    placeholder="0.00"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="method"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="payment-method">
                    Payment Method <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="payment-method">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="MPESA">M-Pesa</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="reference"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="payment-reference">Reference Number</FieldLabel>
                  <Input
                    {...field}
                    id="payment-reference"
                    placeholder="Cheque number, M-Pesa reference, etc."
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </Field>
              )}
            />

            <Controller
              name="note"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="payment-note">Note (optional)</FieldLabel>
                  <Textarea
                    {...field}
                    id="payment-note"
                    placeholder="Additional payment details..."
                    rows={2}
                    className="resize-none"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </Field>
              )}
            />
          </FieldGroup>

          <Separator />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
              {isPending ? "Processing..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
