"use client";

import { Controller, UseFormReturn } from "react-hook-form";
import { ProductFormValues } from "@/lib/validations/product";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category } from "@/types";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { generateBarcode, generateSKU } from "@/lib/barcode";

type Props = {
  form: UseFormReturn<ProductFormValues>;
  categories: Category[];
};

export function BasicInfoTab({ form, categories }: Props) {
  // const selectedCategoryId = useWatch({
  //   control: form.control,
  //   name: "categoryId",
  // });
  // const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const handleGenerateSKU = () => {
    form.setValue("sku", generateSKU(), {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleGenerateBarcode = () => {
    form.setValue("barcode", generateBarcode(), {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };
  return (
    <FieldGroup className="space-y-4">
      {/* Name */}
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="name">
              Product Name <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              {...field}
              id="name"
              aria-invalid={fieldState.invalid}
              placeholder="e.g. Bottled Water 500ml"
              autoComplete="off"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Category */}
      <Controller
        name="categoryId"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="categoryId">Category</FieldLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cat.color ?? "#6b7280" }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* SKU + Barcode */}
      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="sku"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sku">
                Product Sku <span className="text-destructive">*</span>
              </FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id="sku"
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g. BEV-001"
                  autoComplete="off"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={handleGenerateSKU}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7
                               text-muted-foreground hover:text-foreground"
                  title="Auto-generate SKU"
                >
                  <Wand2 size={14} />
                </Button>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="barcode"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="barcode">Barcode</FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id="barcode"
                  aria-invalid={fieldState.invalid}
                  placeholder="Scan or auto-generate"
                  autoComplete="off"
                  className="pr-10"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={handleGenerateBarcode
                  }
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7
                     text-muted-foreground hover:text-foreground"
                  title="Auto-generate barcode"
                >
                  <Wand2 size={14} />
                </Button>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      {/* Image URL */}
      <Controller
        name="imageUrl"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="imageUrl">Image URL</FieldLabel>
            <Input
              {...field}
              id="imageUrl"
              aria-invalid={fieldState.invalid}
              placeholder="https://example.com/image.jpg"
              autoComplete="off"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Active toggle */}
      <Controller
        name="isActive"
        control={form.control}
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <FieldLabel>Active</FieldLabel>
              <FieldDescription>
                Inactive products won&apos;t appear on the POS screen
              </FieldDescription>
            </div>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )}
      />
    </FieldGroup>
  );
}
