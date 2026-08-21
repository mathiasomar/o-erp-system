"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductFormValues } from "@/lib/validations/product";
import { Product } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useCategories } from "@/hooks/use-category";
import { useUpdateProduct } from "@/hooks/use-product";
import { BasicInfoTab } from "./form/BasicInfoTab";
import { PricingTab } from "./form/PricingTab";
import { StockTab } from "./form/StockTab";

type Props = {
  open: boolean;
  onClose: () => void;
  product: Product;
};

export function EditProductSheet({ open, onClose, product }: Props) {
  const { data: categories = [] } = useCategories();
  const { mutate, isPending } = useUpdateProduct(product.id, onClose);

  const form = useForm<ProductFormValues, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product.name,
      sku: product.sku,
      barcode: product.barcode ?? "",
      price: product.price,
      lastPrice: product.lastPrice ?? 0,
      costPrice: product.costPrice ?? 0,
      costPriceInclTax: product.costPriceInclTax ?? 0,
      purchaseTaxRate: product.purchaseTaxRate ?? 0,
      taxRate: product.taxRate ?? 0,
      discountRate: product.discountRate ?? 0,
      categoryId: product.categoryId ?? undefined,
      isActive: product.isActive,
      imageUrl: product.imageUrl ?? "",
      stock: {
        quantity: product.stock?.quantity ?? 0,
        lowStockAt: product.stock?.lowStockAt ?? 10,
      },
    } as ProductFormValues,
  });

  // Sync form if product prop changes (e.g. navigating between products)
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode ?? "",
        price: product.price,
        lastPrice: product.lastPrice ?? 0,
        costPrice: product.costPrice ?? 0,
        costPriceInclTax: product.costPriceInclTax ?? 0,
        purchaseTaxRate: product.purchaseTaxRate ?? 0,
        taxRate: product.taxRate ?? 0,
        discountRate: product.discountRate ?? 0,
        categoryId: product.categoryId ?? undefined,
        isActive: product.isActive,
        imageUrl: product.imageUrl ?? "",
        stock: {
          quantity: product.stock?.quantity ?? 0,
          lowStockAt: product.stock?.lowStockAt ?? 10,
        },
      });
    }
  }, [product, form]);

  function onSubmit(values: ProductFormValues) {
    mutate(values);
  }

  function handleClose() {
    form.reset();
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-4">
        <SheetHeader className="mb-4">
          <SheetTitle>Edit Product</SheetTitle>
          <SheetDescription>
            Update the details for{" "}
            <span className="font-medium text-foreground">{product.name}</span>.
            Fields marked <span className="text-destructive">*</span> are
            required.
          </SheetDescription>
        </SheetHeader>

        <Separator className="mb-4" />

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic">
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1">
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex-1">
                Pricing
              </TabsTrigger>
              <TabsTrigger value="stock" className="flex-1">
                Stock
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-4">
              <BasicInfoTab form={form} categories={categories} />
            </TabsContent>
            <TabsContent value="pricing" className="mt-4">
              <PricingTab form={form} />
            </TabsContent>
            <TabsContent value="stock" className="mt-4">
              <StockTab form={form} />
            </TabsContent>
          </Tabs>

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
