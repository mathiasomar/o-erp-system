"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  expenseCategorySchema,
  ExpenseCategoryFormValues,
} from "@/lib/validations/expense";
import { useQueryClient } from "@tanstack/react-query";
import { ExpenseCategoryWithCount } from "@/types";
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
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { updateExpenseCategory } from "@/actions/expense.action";
import { ColorPicker } from "@/components/ColorPicker";

type Props = {
  open: boolean;
  onClose: () => void;
  category: ExpenseCategoryWithCount;
};

export function EditExpenseCategorySheet({ open, onClose, category }: Props) {
  const qc = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const form = useForm<
    ExpenseCategoryFormValues,
    unknown,
    ExpenseCategoryFormValues
  >({
    resolver: zodResolver(expenseCategorySchema),
    defaultValues: {
      name: category.name,
      color: category.color ?? "#3b82f6",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: category.name,
      color: category.color ?? "#3b82f6",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const watchedName = useWatch({
    control: form.control,
    name: "name",
    defaultValue: category.name,
  });
  const watchedColor = useWatch({
    control: form.control,
    name: "color",
    defaultValue: category.color ?? "#3b82f6",
  });

  function onSubmit(values: ExpenseCategoryFormValues) {
    startTransition(async () => {
      const result = await updateExpenseCategory(category.id, values);
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["expense-categories"] });
        toast.success("Category updated");
        onClose();
      } else {
        toast.error("Failed to update category");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-4">
        <SheetHeader className="mb-4">
          <SheetTitle>Edit Category</SheetTitle>
          <SheetDescription>
            Updating{" "}
            <span className="font-medium text-foreground">{category.name}</span>
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
                  <FieldLabel htmlFor="edit-cat-name">
                    Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-cat-name"
                    placeholder="e.g. Utilities"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
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

          {form.formState.isDirty && (
            <p className="text-xs text-muted-foreground text-center">
              You have unsaved changes
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending || !form.formState.isDirty}
            >
              {isPending && <Loader2 size={15} className="mr-2 animate-spin" />}
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
