import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  price: z.number().min(0, "Price must be ≥ 0"),
  lastPrice: z.number().min(0),
  costPrice: z.number().min(0), // excl. tax
  costPriceInclTax: z.number().min(0), // ← new: incl. tax
  purchaseTaxRate: z.number().min(0).max(100), // ← new
  taxRate: z.number().min(0).max(100),
  discountRate: z.number().min(0).max(100),
  categoryId: z.string().optional(),
  isActive: z.boolean(),
  imageUrl: z.string().optional(),
  stock: z.object({
    quantity: z.number().int().min(0),
    lowStockAt: z.number().int().min(0),
  }),
});

export type ProductFormValues = z.infer<typeof productSchema>;
