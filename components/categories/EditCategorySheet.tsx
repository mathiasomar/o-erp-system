"use client";

import { useEffect } from "react";
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
import { useUpdateCategory } from "@/hooks/use-category";
import { ColorPicker } from "../ColorPicker";

type CategoryRow = {
  id: string;
  name: string;
  color: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  category: CategoryRow;
};

export function EditCategorySheet({ open, onClose, category }: Props) {
  const { mutate, isPending } = useUpdateCategory(category.id, onClose);

  const form = useForm<CategoryFormValues, unknown, CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category.name,
      color: category.color ?? "#3b82f6",
    },
  });

  // Sync if category prop changes
  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        color: category.color ?? "#3b82f6",
      });
    }
  }, [category, form]);

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

  function onSubmit(values: CategoryFormValues) {
    mutate(values);
  }

  function handleClose() {
    form.reset();
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-4">
        <SheetHeader className="mb-4">
          <SheetTitle>Edit Category</SheetTitle>
          <SheetDescription>
            Updating{" "}
            <span className="font-medium text-foreground">{category.name}</span>
            . Fields marked <span className="text-destructive">*</span> are
            required.
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

          {/* Dirty state indicator */}
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
              onClick={handleClose}
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
