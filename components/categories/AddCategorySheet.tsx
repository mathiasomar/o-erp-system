"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, CategoryFormValues } from "@/lib/validations/category";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useCreateCategory } from "@/hooks/use-category";
import { ColorPicker } from "../ColorPicker";

type Props = {
  open: boolean;
  onClose: () => void;
};

const defaultValues: CategoryFormValues = {
  name: "",
  color: "#3b82f6",
};

export function AddCategorySheet({ open, onClose }: Props) {
  const { mutate, isPending } = useCreateCategory(onClose);

  const form = useForm<CategoryFormValues, unknown, CategoryFormValues>({
    resolver: zodResolver(categorySchema),
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

  function onSubmit(values: CategoryFormValues) {
    mutate(values, {
      onSuccess() {
        form.reset(defaultValues);
      },
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
          <SheetTitle>Add New Category</SheetTitle>
          <SheetDescription>
            Categories help organise your products on the POS screen.
          </SheetDescription>
        </SheetHeader>

        <Separator className="mb-6" />

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup className="space-y-4">
            {/* Live preview */}
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/40">
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
                  <FieldLabel htmlFor="name">
                    Category Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="name"
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g. Beverages"
                    autoComplete="off"
                  />
                  <FieldDescription>
                    This name appears as a filter badge on the POS screen
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
                    Badge Color <span className="text-destructive">*</span>
                  </FieldLabel>
                  <ColorPicker value={field.value} onChange={field.onChange} />
                  <FieldDescription>
                    Choose a preset or enter a custom hex code
                  </FieldDescription>
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
