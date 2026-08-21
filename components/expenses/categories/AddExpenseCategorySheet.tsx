"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  expenseCategorySchema,
  ExpenseCategoryFormValues,
} from "@/lib/validations/expense";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { createExpenseCategory } from "@/actions/expense.action";
import { ColorPicker } from "@/components/ColorPicker";

type Props = {
  open: boolean;
  onClose: () => void;
};

const defaultValues: ExpenseCategoryFormValues = {
  name: "",
  color: "#3b82f6",
};

export function AddExpenseCategorySheet({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const form = useForm<
    ExpenseCategoryFormValues,
    unknown,
    ExpenseCategoryFormValues
  >({
    resolver: zodResolver(expenseCategorySchema),
    defaultValues,
  });

  const watchedName = useWatch({
    control: form.control,
    name: "name",
    defaultValue: defaultValues.name,
  });
  const watchedColor = useWatch({
    control: form.control,
    name: "color",
    defaultValue: defaultValues.color,
  });

  function onSubmit(values: ExpenseCategoryFormValues) {
    startTransition(async () => {
      const result = await createExpenseCategory(values);
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["expense-categories"] });
        toast.success("Category created");
        form.reset(defaultValues);
        onClose();
      } else {
        toast.error("Failed to create category");
      }
    });
  }

  function handleClose() {
    form.reset(defaultValues);
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-4">
        <SheetHeader className="mb-4">
          <SheetTitle>Add Expense Category</SheetTitle>
          <SheetDescription>
            Categories help organise your expenses.
          </SheetDescription>
        </SheetHeader>

        <Separator className="mb-6" />

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup className="space-y-4">
            {/* Live preview */}
            <div
              className="flex items-center gap-3 p-4 rounded-lg
                            border bg-muted/40"
            >
              <span className="text-sm text-muted-foreground">Preview:</span>
              <Badge
                style={{ backgroundColor: watchedColor || "#6b7280" }}
                className="text-white text-sm px-3 py-1"
              >
                {watchedName || "Category name"}
              </Badge>
            </div>

            {/* Name */}
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="cat-name">
                    Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="cat-name"
                    placeholder="e.g. Utilities"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    Appears as a badge on each expense
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Color */}
            <Controller
              name="color"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Color <span className="text-destructive">*</span>
                  </FieldLabel>
                  <ColorPicker value={field.value} onChange={field.onChange} />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

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
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending && <Loader2 size={15} className="mr-2 animate-spin" />}
              {isPending ? "Saving..." : "Save Category"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
