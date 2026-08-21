"use client";

import { Controller, UseFormReturn, useWatch } from "react-hook-form";
import { ProductFormValues } from "@/lib/validations/product";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

type Props = { form: UseFormReturn<ProductFormValues> };

export function StockTab({ form }: Props) {
  const qty =
    useWatch({
      control: form.control,
      name: "stock.quantity",
      defaultValue: 0,
    }) ?? 0;
  const lowAt =
    useWatch({
      control: form.control,
      name: "stock.lowStockAt",
      defaultValue: 10,
    }) ?? 10;
  const isLow = qty > 0 && qty <= lowAt;

  return (
    <FieldGroup className="space-y-4">
      {/* Opening stock */}
      <Controller
        name="stock.quantity"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="stock.quantity">
              Opening Stock Quantity
            </FieldLabel>
            <Input
              {...field}
              id="stock.quantity"
              type="number"
              aria-invalid={fieldState.invalid}
              min={0}
              placeholder="0"
              onChange={(e) => {
                const val = e.target.value;
                // Allow empty string while typing, store as-is for validation
                field.onChange(val === "" ? "" : e.target.valueAsNumber);
              }}
              onBlur={(e) => {
                // Convert to 0 on blur if empty
                const val = e.target.value;
                if (val === "") {
                  field.onChange(0);
                }
                field.onBlur();
              }}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Low stock threshold */}
      <Controller
        name="stock.lowStockAt"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="stock.lowStockAt">
              Low Stock Alert Threshold
            </FieldLabel>
            <Input
              {...field}
              id="stock.lowStockAt"
              type="number"
              aria-invalid={fieldState.invalid}
              min={0}
              placeholder="10"
              onChange={(e) => {
                const val = e.target.value;
                // Allow empty string while typing, store as-is for validation
                field.onChange(val === "" ? "" : e.target.valueAsNumber);
              }}
              onBlur={(e) => {
                // Convert to 0 on blur if empty
                const val = e.target.value;
                if (val === "") {
                  field.onChange(0);
                }
                field.onBlur();
              }}
            />
            <FieldDescription>
              You&apos;ll be alerted when stock drops to or below this number
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Stock status preview */}
      <div className="rounded-lg border bg-muted/40 p-4 space-y-1 text-sm">
        <p className="font-medium">Stock preview</p>
        {qty === 0 && (
          <p className="text-destructive">⚠ Will be marked as out of stock</p>
        )}
        {isLow && (
          <p className="text-orange-500">
            ⚠ Below low-stock threshold ({lowAt} units)
          </p>
        )}
        {qty > lowAt && (
          <p className="text-green-600">✓ Stock level looks healthy</p>
        )}
      </div>
    </FieldGroup>
  );
}
