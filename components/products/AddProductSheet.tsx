"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useCategories } from "@/hooks/use-category";
import { useCreateProduct } from "@/hooks/use-product";
import { BasicInfoTab } from "./form/BasicInfoTab";
import { PricingTab } from "./form/PricingTab";
import { StockTab } from "./form/StockTab";
import { ProductFormValues, productSchema } from "@/lib/validations/product";

type Props = {
  open: boolean;
  onClose: () => void;
};

const defaultValues: ProductFormValues = {
  name: "",
  sku: "",
  barcode: "",
  price: 0,
  lastPrice: 0,
  costPrice: 0,
  costPriceInclTax: 0, // ← new: incl. tax
  purchaseTaxRate: 0, // ← new
  taxRate: 0,
  discountRate: 0,
  categoryId: undefined,
  isActive: true,
  imageUrl: "",
  stock: {
    quantity: 0,
    lowStockAt: 10,
  },
};

export function AddProductSheet({ open, onClose }: Props) {
  const { data: categories = [] } = useCategories();
  const { mutate, isPending } = useCreateProduct(onClose);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues as ProductFormValues,
  });

  function onSubmit(values: ProductFormValues) {
    mutate(values, {
      onSuccess() {
        form.reset(defaultValues);
      },
    });
  }

  function handleClose() {
    form.reset({
      name: "",
      sku: "",
      barcode: "",
      price: 0,
      lastPrice: 0,
      costPrice: 0,
      costPriceInclTax: 0,
      purchaseTaxRate: 0,
      taxRate: 0,
      discountRate: 0,
      categoryId: undefined,
      isActive: true,
      imageUrl: "",
      stock: {
        quantity: 0,
        lowStockAt: 10,
      },
    });
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-4">
        <SheetHeader className="mb-4">
          <SheetTitle>Add New Product</SheetTitle>
          <SheetDescription>
            Fill in the details below. Fields marked{" "}
            <span className="text-destructive">*</span> are required.
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
              {isPending ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
