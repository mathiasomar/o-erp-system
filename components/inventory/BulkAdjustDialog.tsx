// src/components/inventory/BulkAdjustDialog.tsx

"use client";
"use no memo";

import { useState, useEffect } from "react";
import { Controller, useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InventoryItem } from "@/types";
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
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, TrendingUp, TrendingDown, ChevronsDown } from "lucide-react";
import { useBulkAdjustStock } from "@/hooks/use-inventory";

// ── schema ────────────────────────────────────────────────────────────────────

const rowSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  sku: z.string(),
  currentQty: z.number(),
  lowStockAt: z.number(),
  change: z
    .number({ error: "Enter a number" })
    .int("Must be a whole number")
    .refine((n) => n !== 0, "Cannot be zero"),
});

const schema = z.object({
  reason: z.enum([
    "RESTOCK",
    "MANUAL_INCREASE",
    "MANUAL_DECREASE",
    "DAMAGED",
    "RETURNED",
    "EXPIRED",
  ]),
  note: z.string().optional(),
  rows: z.array(rowSchema),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

// ── constants ─────────────────────────────────────────────────────────────────

const REASONS = [
  { value: "RESTOCK", label: "Restock" },
  { value: "MANUAL_INCREASE", label: "Manual increase" },
  { value: "MANUAL_DECREASE", label: "Manual decrease" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "RETURNED", label: "Returned" },
  { value: "EXPIRED", label: "Expired" },
] as const;

// ── helpers ───────────────────────────────────────────────────────────────────

function qtyColor(newQty: number, lowAt: number): string {
  if (newQty < 0) return "text-destructive";
  if (newQty <= lowAt) return "text-orange-500";
  return "text-green-600";
}

// ── types ─────────────────────────────────────────────────────────────────────

type ResultItem = {
  productId: string | undefined;
  productName: string;
  success: boolean;
  message?: string;
};

type BulkAdjustResult = {
  productId: string | undefined;
  success: boolean;
  message?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  items: InventoryItem[];
};

// ── component ─────────────────────────────────────────────────────────────────

export const BulkAdjustDialog = ({ open, onClose, items }: Props) => {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [done, setDone] = useState(false);
  const [fillAll, setFillAll] = useState<string>("");

  const { mutate, isPending } = useBulkAdjustStock(
    (raw: BulkAdjustResult[]) => {
      const mapped: ResultItem[] = raw.map((r, i) => ({
        ...r,
        productName:
          items.find((x) => x.productId === r.productId)?.product.name ??
          `Product ${i + 1}`,
      }));
      setResults(mapped);
      setDone(true);
    },
  );

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      reason: "RESTOCK",
      note: "",
      rows: items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        currentQty: item.quantity,
        lowStockAt: item.lowStockAt,
        change: 0,
      })),
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "rows",
  });

  // Reset form when dialog opens — NOT when items changes (avoids setState in effect)
  useEffect(() => {
    if (!open) return;
    form.reset({
      reason: "RESTOCK",
      note: "",
      rows: items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        currentQty: item.quantity,
        lowStockAt: item.lowStockAt,
        change: 0,
      })),
    });
    // fillAll reset handled in handleClose — not here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const watchedRows = useWatch({ control: form.control, name: "rows" }) || [];

  // Apply fill-all value to every row
  const handleFillAll = () => {
    const val = parseInt(fillAll, 10);
    if (isNaN(val)) return;
    fields.forEach((_, i) => {
      form.setValue(`rows.${i}.change`, val, { shouldValidate: true });
    });
  };

  const handleClose = () => {
    form.reset();
    setResults([]);
    setDone(false);
    setFillAll(""); // ← safe here — event handler, not effect body
    onClose();
  };

  const onSubmit = (values: FormValues) => {
    const validRows = values.rows.filter((r) => {
      const n = parseInt(String(r.change), 10);
      return !isNaN(n) && n !== 0;
    });
    if (validRows.length === 0) return;

    mutate({
      items: validRows.map((r) => ({
        productId: r.productId,
        change: parseInt(String(r.change), 10),
        reason: values.reason,
        note: values.note,
      })),
      sharedReason: values.reason,
      sharedNote: values.note,
    });
  };

  const changedCount: number = watchedRows.filter((r) => {
    const n = parseInt(String(r.change), 10);
    return !isNaN(n) && n !== 0;
  }).length;

  const belowZeroCount: number = watchedRows.filter((r) => {
    const item = items.find((i) => i.productId === r.productId);
    const change = parseInt(String(r.change), 10);
    return item !== undefined && !isNaN(change) && item.quantity + change < 0;
  }).length;

  // ── Result screen ──────────────────────────────────────────────────────────
  if (done) {
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adjustment complete</DialogTitle>
            <DialogDescription>
              {successCount} succeeded · {failCount} failed
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-80">
            <div className="space-y-2 pr-3">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3
                    rounded-lg border text-sm
                    ${
                      r.success
                        ? "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800"
                        : "border-destructive/30 bg-destructive/5"
                    }`}
                >
                  <span className="font-medium truncate">{r.productName}</span>
                  {r.success ? (
                    <Badge variant="default" className="shrink-0 ml-2">
                      Updated
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="shrink-0 ml-2">
                      {r.message ?? "Failed"}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Form screen ────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          <DialogHeader>
            <DialogTitle>Bulk Stock Adjustment</DialogTitle>
            <DialogDescription>
              Set individual quantity changes per product. Leave a row at{" "}
              <span className="font-mono font-medium">0</span> to skip it.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Separator />

        <form
          id="bulk-adjust-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 min-h-0 flex flex-col"
        >
          {/* ── Global settings ──────────────────────────────────────── */}
          <div className="px-6 py-4 shrink-0 space-y-4 bg-muted/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Reason */}
              <Controller
                name="reason"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Reason <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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

              {/* Note */}
              <Controller
                name="note"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Note (optional)</FieldLabel>
                    <Input placeholder="e.g. Monthly restock..." {...field} />
                  </Field>
                )}
              />
            </div>

            {/* Fill all shortcut */}
            <div className="flex items-end gap-2">
              <Field className="flex-1">
                <FieldLabel>Fill all rows with same change</FieldLabel>
                <Input
                  type="number"
                  placeholder="e.g. 50 or -5"
                  value={fillAll}
                  onChange={(e) => setFillAll(e.target.value)}
                />
                <FieldDescription>
                  Type a value then click Apply to fill all rows at once
                </FieldDescription>
              </Field>
              <Button
                type="button"
                variant="outline"
                onClick={handleFillAll}
                disabled={!fillAll || isNaN(parseInt(fillAll, 10))}
                className="mb-5.5"
              >
                <ChevronsDown size={14} className="mr-1.5" />
                Apply to all
              </Button>
            </div>
          </div>

          <Separator />

          {/* ── Per-product rows ─────────────────────────────────────── */}
          <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-6 py-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead className="w-40">
                      Change
                      <span className="text-muted-foreground font-normal ml-1 text-xs">
                        (individual)
                      </span>
                    </TableHead>
                    <TableHead>After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const row = watchedRows[index];
                    const item = items.find(
                      (i) => i.productId === field.productId,
                    );
                    const change = parseInt(String(row?.change), 10);
                    const current = item?.quantity ?? 0;
                    const lowAt = item?.lowStockAt ?? 10;
                    const newQty = isNaN(change) ? current : current + change;
                    const isEmpty = current === 0;
                    const isLow = current > 0 && current <= lowAt;

                    return (
                      <TableRow key={field.id}>
                        {/* Product name + SKU */}
                        <TableCell>
                          <p className="font-medium text-sm leading-tight">
                            {field.productName}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {field.sku}
                          </p>
                        </TableCell>

                        {/* Current stock badge */}
                        <TableCell>
                          <Badge
                            variant={
                              isEmpty
                                ? "destructive"
                                : isLow
                                  ? "outline"
                                  : "secondary"
                            }
                            className={
                              isLow && !isEmpty
                                ? "border-orange-400 text-orange-600"
                                : ""
                            }
                          >
                            {current}
                          </Badge>
                        </TableCell>

                        {/* Individual change input */}
                        <TableCell>
                          <Controller
                            name={`rows.${index}.change`}
                            control={form.control}
                            render={({ field: f, fieldState }) => (
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  placeholder="0"
                                  className={`w-28 h-8 text-sm ${
                                    fieldState.invalid
                                      ? "border-destructive"
                                      : ""
                                  }`}
                                  // Convert NaN to empty string so React doesn't warn
                                  value={
                                    f.value === null ||
                                    f.value === undefined ||
                                    (typeof f.value === "number" &&
                                      isNaN(f.value as number))
                                      ? ""
                                      : (f.value as number)
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    // Allow empty string while typing, store as-is for validation
                                    f.onChange(
                                      val === "" ? "" : e.target.valueAsNumber,
                                    );
                                  }}
                                  onBlur={(e) => {
                                    // Validate on blur - empty field is invalid (must be non-zero)
                                    const val = e.target.value;
                                    if (val === "") {
                                      f.onChange("");
                                    }
                                    f.onBlur();
                                  }}
                                />
                                {fieldState.invalid && (
                                  <p className="text-xs text-destructive">
                                    {fieldState.error?.message}
                                  </p>
                                )}
                              </div>
                            )}
                          />
                        </TableCell>

                        {/* After adjustment preview */}
                        <TableCell>
                          {change === 0 ? (
                            <span className="text-muted-foreground text-xs">
                              No change
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`font-semibold text-sm
                                ${qtyColor(newQty, lowAt)}`}
                              >
                                {newQty}
                              </span>
                              <Badge
                                variant={change > 0 ? "default" : "destructive"}
                                className="text-xs px-1.5"
                              >
                                {change > 0 ? (
                                  <TrendingUp
                                    size={10}
                                    className="inline mr-0.5"
                                  />
                                ) : (
                                  <TrendingDown
                                    size={10}
                                    className="inline mr-0.5"
                                  />
                                )}
                                {change > 0 ? `+${change}` : change}
                              </Badge>
                              {newQty < 0 && (
                                <span className="text-xs text-destructive">
                                  ⚠ below zero
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>

          {/* ── Warnings ─────────────────────────────────────────────── */}
          {belowZeroCount > 0 && (
            <div className="px-6 py-2 shrink-0">
              <p
                className="text-xs text-destructive bg-destructive/10
                            border border-destructive/20 rounded-lg px-3 py-2"
              >
                ⚠ {belowZeroCount} product
                {belowZeroCount !== 1 ? "s" : ""} will go below zero and will be
                skipped.
              </p>
            </div>
          )}

          <Separator />

          {/* ── Footer ───────────────────────────────────────────────── */}
          <div
            className="px-6 py-4 shrink-0 flex items-center
                          justify-between gap-3 flex-wrap"
          >
            <p className="text-sm text-muted-foreground">
              {changedCount > 0 ? (
                <>
                  <span className="font-medium text-foreground">
                    {changedCount}
                  </span>{" "}
                  product{changedCount !== 1 ? "s" : ""} will be updated
                  {belowZeroCount > 0 && (
                    <span className="text-destructive">
                      {" "}
                      ({belowZeroCount} skipped)
                    </span>
                  )}
                </>
              ) : (
                "Set at least one change to apply"
              )}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="bulk-adjust-form"
                disabled={isPending || changedCount === 0}
              >
                {isPending && (
                  <Loader2 size={15} className="mr-2 animate-spin" />
                )}
                {isPending
                  ? "Applying..."
                  : `Apply${
                      changedCount > 0
                        ? ` (${changedCount} product${changedCount !== 1 ? "s" : ""})`
                        : ""
                    }`}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
