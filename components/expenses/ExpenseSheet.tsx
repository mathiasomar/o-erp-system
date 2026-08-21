"use client";
"use no memo";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, ExpenseFormValues } from "@/lib/validations/expense";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Expense } from "@/types";
import {
  useCreateExpense,
  useExpenseCategories,
  useUpdateExpense,
} from "@/hooks/use-expense";

type Props = {
  open: boolean;
  onClose: () => void;
  expense?: Expense; // if provided → edit mode
};

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "MPESA", label: "M-Pesa" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
] as const;

const FREQUENCIES = [
  { value: "ONE_TIME", label: "One-time" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
] as const;

const defaultValues: ExpenseFormValues = {
  title: "",
  amount: 0,
  date: format(new Date(), "yyyy-MM-dd"),
  note: "",
  receiptUrl: "",
  paymentMethod: "CASH",
  frequency: "ONE_TIME",
  isRecurring: false,
  categoryId: undefined,
};

export function ExpenseSheet({ open, onClose, expense }: Props) {
  const isEdit = !!expense;
  const { data: categories = [] } = useExpenseCategories();

  const { mutate: create, isPending: creating } = useCreateExpense(onClose);
  const { mutate: update, isPending: updating } = useUpdateExpense(
    expense?.id ?? "",
    onClose,
  );
  const isPending = creating || updating;

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues,
  });

  const isRecurring = useWatch({ control: form.control, name: "isRecurring" });

  // Pre-fill form in edit mode
  useEffect(() => {
    if (!open) return;
    if (expense) {
      form.reset({
        title: expense.title,
        amount: expense.amount,
        date: format(new Date(expense.date), "yyyy-MM-dd"),
        note: expense.note ?? "",
        receiptUrl: expense.receiptUrl ?? "",
        paymentMethod: expense.paymentMethod,
        frequency: expense.frequency,
        isRecurring: expense.isRecurring,
        categoryId: expense.categoryId ?? undefined,
      });
    } else {
      form.reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onSubmit(values: ExpenseFormValues) {
    const cleaned = {
      ...values,
      categoryId: values.categoryId === "none" ? undefined : values.categoryId,
    };
    if (isEdit) {
      update(cleaned);
    } else {
      create(cleaned);
    }
  }

  function handleClose() {
    form.reset(defaultValues);
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-4">
        <SheetHeader className="mb-4">
          <SheetTitle>{isEdit ? "Edit Expense" : "Add Expense"}</SheetTitle>
          <SheetDescription>
            Fields marked <span className="text-destructive">*</span> are
            required.
          </SheetDescription>
        </SheetHeader>

        <Separator className="mb-6" />

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FieldGroup className="space-y-4">
            {/* Title */}
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="title">
                    Title <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="title"
                    placeholder="e.g. Office rent"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Amount + Date */}
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="amount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="amount">
                      Amount (KES) <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="amount"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      aria-invalid={fieldState.invalid}
                      value={field.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(
                          val === "" ? "" : e.target.valueAsNumber,
                        );
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
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="date"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="date">
                      Date <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="date"
                      type="date"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            {/* Category */}
            <Controller
              name="categoryId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Category</FieldLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? "none"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                backgroundColor: cat.color ?? "#6b7280",
                              }}
                            />
                            {cat.name}
                          </div>
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

            {/* Payment method */}
            <Controller
              name="paymentMethod"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Payment method <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
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

            {/* Recurring toggle */}
            <Controller
              name="isRecurring"
              control={form.control}
              render={({ field }) => (
                <div
                  className="flex items-center justify-between
                                rounded-lg border p-4"
                >
                  <div>
                    <FieldLabel>Recurring expense</FieldLabel>
                    <FieldDescription>
                      Enable if this expense repeats on a schedule
                    </FieldDescription>
                  </div>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />

            {/* Frequency — only when recurring */}
            {isRecurring && (
              <Controller
                name="frequency"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Frequency</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCIES.filter((f) => f.value !== "ONE_TIME").map(
                          (f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            )}

            {/* Note */}
            <Controller
              name="note"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Note</FieldLabel>
                  <Input
                    {...field}
                    id="note"
                    placeholder="Optional description..."
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Receipt URL */}
            <Controller
              name="receiptUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Receipt URL</FieldLabel>
                  <Input
                    {...field}
                    id="receiptUrl"
                    placeholder="https://..."
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    Link to a receipt image or document
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <Separator />

          {form.formState.isDirty && isEdit && (
            <p className="text-xs text-muted-foreground text-center">
              You have unsaved changes
            </p>
          )}

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
              disabled={isPending || (isEdit && !form.formState.isDirty)}
            >
              {isPending && <Loader2 size={15} className="mr-2 animate-spin" />}
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Add Expense"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
