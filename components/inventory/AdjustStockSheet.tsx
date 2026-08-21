"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InventoryItem } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useAdjustStock } from "@/hooks/use-inventory";

const schema = z.object({
  change: z
    .number({ error: "Enter a number" })
    .int("Must be a whole number")
    .refine((n) => n !== 0, "Cannot be zero"),
  reason: z.enum([
    "RESTOCK",
    "MANUAL_INCREASE",
    "MANUAL_DECREASE",
    "DAMAGED",
    "RETURNED",
    "EXPIRED",
  ]),
  note: z.string().optional(),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.infer<typeof schema>;

const REASONS = [
  { value: "RESTOCK", label: "Restock" },
  { value: "MANUAL_INCREASE", label: "Manual increase" },
  { value: "MANUAL_DECREASE", label: "Manual decrease" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "RETURNED", label: "Returned" },
  { value: "EXPIRED", label: "Expired" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  item: InventoryItem;
};

export const AdjustStockSheet = ({ open, onClose, item }: Props) => {
  const { mutate, isPending } = useAdjustStock(onClose);

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { change: 0, reason: "RESTOCK", note: "" },
  });

  const watchedChange = useWatch({
    control: form.control,
    name: "change",
    defaultValue: 0,
  });
  const changeValue =
    typeof watchedChange === "number" && !isNaN(watchedChange)
      ? watchedChange
      : 0;
  const newQty = item.quantity + changeValue;

  function onSubmit(values: FormValues) {
    mutate({ productId: item.productId, ...values });
  }

  function handleClose() {
    form.reset();
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-4">
        <SheetHeader className="mb-4">
          <SheetTitle>Adjust Stock</SheetTitle>
          <SheetDescription>
            Updating stock for{" "}
            <span className="font-medium text-foreground">
              {item.product.name}
            </span>
          </SheetDescription>
        </SheetHeader>

        <Separator className="mb-6" />

        {/* Current stock summary */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/40 mb-6">
          <div className="space-y-0.5">
            <p className="text-sm text-muted-foreground">Current stock</p>
            <p className="text-2xl font-bold">{item.quantity}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {item.product.sku}
            </p>
          </div>
          {changeValue !== 0 && (
            <div className="text-right space-y-0.5">
              <p className="text-sm text-muted-foreground">After adjustment</p>
              <p
                className={`text-2xl font-bold ${
                  newQty < 0
                    ? "text-destructive"
                    : newQty <= item.lowStockAt
                      ? "text-orange-500"
                      : "text-green-600"
                }`}
              >
                {newQty}
              </p>
              <Badge
                variant={changeValue > 0 ? "default" : "destructive"}
                className="text-xs"
              >
                {changeValue > 0 ? `+${changeValue}` : changeValue}
              </Badge>
            </div>
          )}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup className="space-y-4">
            {/* Reason */}
            <Controller
              name="reason"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Reason <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Change amount */}
            <Controller
              name="change"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Quantity change <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="change"
                    type="number"
                    placeholder="e.g. 50 or -5"
                    aria-invalid={fieldState.invalid}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Allow empty string while typing, store as-is for validation
                      field.onChange(val === "" ? "" : e.target.valueAsNumber);
                    }}
                    onBlur={(e) => {
                      // Validate on blur - empty field is invalid (must be non-zero)
                      const val = e.target.value;
                      if (val === "") {
                        field.onChange("");
                      }
                      field.onBlur();
                    }}
                  />
                  <FieldDescription>
                    Use a positive number to add stock, negative to remove
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Note */}
            <Controller
              name="note"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Note (optional)</FieldLabel>
                  <Input
                    id="note"
                    placeholder="e.g. Received from supplier..."
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          {/* Warn if new qty goes below threshold */}
          {changeValue !== 0 && newQty >= 0 && newQty <= item.lowStockAt && (
            <p
              className="text-xs text-orange-500 bg-orange-50 dark:bg-orange-950/30
                          border border-orange-200 dark:border-orange-800
                          rounded-lg px-3 py-2"
            >
              ⚠ New quantity ({newQty}) is at or below the low-stock threshold (
              {item.lowStockAt} units)
            </p>
          )}

          {changeValue !== 0 && newQty < 0 && (
            <p
              className="text-xs text-destructive bg-destructive/10
                          border border-destructive/20 rounded-lg px-3 py-2"
            >
              Stock cannot go below zero
            </p>
          )}

          <Separator />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending || newQty < 0}
            >
              {isPending && <Loader2 size={15} className="mr-2 animate-spin" />}
              {isPending ? "Saving..." : "Apply Adjustment"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
