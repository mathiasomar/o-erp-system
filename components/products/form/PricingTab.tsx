"use client";

import { Controller, UseFormReturn, useWatch } from "react-hook-form";
import { ProductFormValues } from "@/lib/validations/product";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

type Props = { form: UseFormReturn<ProductFormValues> };

export function PricingTab({ form }: Props) {
  const price =
    useWatch({ control: form.control, name: "price", defaultValue: 0 }) ?? 0;

  const lastPrice =
    useWatch({ control: form.control, name: "lastPrice", defaultValue: 0 }) ??
    0;

  const costPrice =
    useWatch({ control: form.control, name: "costPrice", defaultValue: 0 }) ??
    0;

  const purchaseTaxRate =
    useWatch({
      control: form.control,
      name: "purchaseTaxRate",
      defaultValue: 0,
    }) ?? 0;

  const costPriceInclTax =
    useWatch({
      control: form.control,
      name: "costPriceInclTax",
      defaultValue: 0,
    }) ?? 0;

  const computedInclusive = costPrice * (1 + purchaseTaxRate / 100);

  const margin =
    price > 0 ? (((price - costPrice) / price) * 100).toFixed(1) : "0.0";

  const handleExclChange = (val: number | "") => {
    const num = val === "" ? 0 : val;

    form.setValue("costPrice", num, {
      shouldDirty: true,
      shouldValidate: true,
    });

    form.setValue("costPriceInclTax", num * (1 + purchaseTaxRate / 100), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleInclChange = (val: number | "") => {
    const num = val === "" ? 0 : val;
    const rate = purchaseTaxRate / 100;
    const excl = rate > 0 ? num / (1 + rate) : num;

    form.setValue("costPriceInclTax", num, {
      shouldDirty: true,
      shouldValidate: true,
    });

    form.setValue("costPrice", excl, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleTaxRateChange = (val: number | "") => {
    const num = val === "" ? 0 : val;

    form.setValue("purchaseTaxRate", num, {
      shouldDirty: true,
      shouldValidate: true,
    });

    form.setValue("costPriceInclTax", costPrice * (1 + num / 100), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <FieldGroup className="space-y-4">
      {/* Selling Price */}
      <Controller
        name="price"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="price">
              Selling Price (KES) <span className="text-destructive">*</span>
            </FieldLabel>

            <Input
              {...field}
              id="price"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val === "" ? "" : e.target.valueAsNumber);
              }}
              onBlur={(e) => {
                if (e.target.value === "") field.onChange(0);
                field.onBlur();
              }}
            />

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Minimum Price */}
      <Controller
        name="lastPrice"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="lastPrice">
              Last Price/Minimum Price (KES)
            </FieldLabel>

            <Input
              {...field}
              id="lastPrice"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val === "" ? "" : e.target.valueAsNumber);
              }}
              onBlur={(e) => {
                if (e.target.value === "") field.onChange(0);
                field.onBlur();
              }}
            />

            <FieldDescription>
              Lowest price allowed during bargaining.
            </FieldDescription>

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Separator />

      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Purchase / Cost Price
      </p>

      {/* Purchase Tax */}
      <Controller
        name="purchaseTaxRate"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="purchaseTaxRate">
              Purchase Tax Rate (%)
            </FieldLabel>

            <Input
              {...field}
              id="purchaseTaxRate"
              type="number"
              min={0}
              max={100}
              step="0.01"
              placeholder="0"
              onChange={(e) => {
                const val = e.target.value;
                handleTaxRateChange(val === "" ? "" : e.target.valueAsNumber);
              }}
              onBlur={(e) => {
                if (e.target.value === "") handleTaxRateChange(0);
                field.onBlur();
              }}
            />

            <FieldDescription>VAT charged by the supplier.</FieldDescription>
          </Field>
        )}
      />

      {/* Cost Excluding Tax */}
      <Controller
        name="costPrice"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="costPrice">
              Cost Price — Excl. Tax (KES)
            </FieldLabel>

            <Input
              {...field}
              id="costPrice"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              onChange={(e) => {
                const val = e.target.value;
                handleExclChange(val === "" ? "" : e.target.valueAsNumber);
              }}
              onBlur={(e) => {
                if (e.target.value === "") handleExclChange(0);
                field.onBlur();
              }}
            />

            <FieldDescription>Unit cost before tax.</FieldDescription>

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Cost Including Tax */}
      <Controller
        name="costPriceInclTax"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="costPriceInclTax">
              Cost Price — Incl. Tax (KES)
            </FieldLabel>

            <Input
              {...field}
              id="costPriceInclTax"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              onChange={(e) => {
                const val = e.target.value;
                handleInclChange(val === "" ? "" : e.target.valueAsNumber);
              }}
              onBlur={(e) => {
                if (e.target.value === "") handleInclChange(0);
                field.onBlur();
              }}
            />

            <FieldDescription>
              Automatically syncs with exclusive cost.
            </FieldDescription>

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Selling Tax */}
      <Controller
        name="taxRate"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="taxRate">Selling Tax Rate (%)</FieldLabel>

            <Input
              {...field}
              id="taxRate"
              type="number"
              min={0}
              max={100}
              step="0.01"
              placeholder="0"
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val === "" ? "" : e.target.valueAsNumber);
              }}
              onBlur={(e) => {
                if (e.target.value === "") field.onChange(0);
                field.onBlur();
              }}
            />

            <FieldDescription>
              Tax charged when selling the product.
            </FieldDescription>
          </Field>
        )}
      />

      {/* Preview */}
      {price > 0 && (
        <div className="rounded-lg border bg-muted/40 p-4 grid grid-cols-4 gap-4 text-center text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Selling</p>
            <p className="font-bold">KES {price.toLocaleString()}</p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">Cost (Excl.)</p>
            <p className="font-bold">KES {costPrice.toLocaleString()}</p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">Cost (Incl.)</p>
            <p className="font-bold text-orange-600">
              KES {computedInclusive.toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">Margin</p>
            <p
              className={`font-bold ${
                parseFloat(margin) < 0 ? "text-destructive" : "text-green-600"
              }`}
            >
              {margin}%
            </p>
          </div>
        </div>
      )}
    </FieldGroup>
  );
}
