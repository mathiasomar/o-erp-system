"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireBranchContext } from "@/lib/branch-context";
import { logActivity } from "@/lib/activity-logger";
import { ActivityAction } from "@/generated/prisma/enums";
import { generateBarcode, generateSKU } from "@/lib/barcode";

// ── Row schema — every column is optional so we can give per-row errors ───────

const importRowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().trim().min(1, "SKU is required"),
  barcode: z.string().trim().optional().default(""),
  price: z.coerce.number().min(0, "Price must be ≥ 0"),
  lastPrice: z.coerce.number().min(0).optional().default(0),
  costPrice: z.coerce.number().min(0).optional().default(0),
  costPriceInclTax: z.coerce.number().min(0).optional().default(0), // ← new: incl. tax
  purchaseTaxRate: z.coerce.number().min(0).max(100).optional().default(0), // ← new
  category: z.string().optional(), // resolved to categoryId
  quantity: z.coerce.number().int().min(0).optional().default(0),
  lowStockAt: z.coerce.number().int().min(0).optional().default(10),
  isActive: z
    .preprocess((v) => {
      if (typeof v === "boolean") return v;
      if (typeof v === "string") {
        return !["false", "0", "no", "inactive"].includes(v.toLowerCase());
      }
      return true;
    }, z.boolean())
    .optional()
    .default(true),
  discountRate: z.coerce.number().min(0).max(100).optional().default(0),
  taxRate: z.coerce.number().min(0).max(100).optional().default(0),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export type ImportRow = z.input<typeof importRowSchema>;
export type ImportRowParsed = z.infer<typeof importRowSchema>;

export type ImportRowResult = {
  row: number;
  name: string;
  sku: string;
  status: "created" | "updated" | "skipped" | "error";
  message: string;
};

export type ImportResult = {
  success: boolean;
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  rows: ImportRowResult[];
};

// ── Validate rows (preview before importing) ──────────────────────────────────

export const validateImportRows = async (
  rows: ImportRow[],
): Promise<{ rowIndex: number; errors: string[] }[]> => {
  const issues: { rowIndex: number; errors: string[] }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const result = importRowSchema.safeParse(rows[i]);
    if (!result.success) {
      issues.push({
        rowIndex: i,
        errors: result.error.issues.map((e) => {
          const path = e.path.length > 0 ? e.path.join(".") : "value";
          return `${path}: ${e.message}`;
        }),
      });
    }
  }

  return issues;
};

// ── Import rows ───────────────────────────────────────────────────────────────

export const importProducts = async (
  rows: ImportRow[],
  strategy: "skip" | "update" = "update", // what to do on duplicate SKU
): Promise<ImportResult> => {
  const ctx = await requireBranchContext();

  const result: ImportResult = {
    success: true,
    total: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    rows: [],
  };

  // Pre-load all categories for this branch (to resolve by name)
  const categories = await prisma.category.findMany({
    where: { branchId: ctx.branchId },
    select: { id: true, name: true },
  });
  const catMap = new Map(
    categories.map((c) => [c.name.toLowerCase().trim(), c.id]),
  );

  // Pre-load existing SKUs for this branch (to detect duplicates)
  const existingProducts = await prisma.product.findMany({
    where: { branchId: ctx.branchId },
    select: { id: true, sku: true },
  });
  const skuMap = new Map(
    existingProducts.map((p) => [p.sku.toLowerCase().trim(), p.id]),
  );

  for (let i = 0; i < rows.length; i++) {
    const rawRow = rows[i];
    const rowNum = i + 1;

    // ── Validate ────────────────────────────────────────────────────────────
    const parsed = importRowSchema.safeParse(rawRow);
    if (!parsed.success) {
      const errs = parsed.error.issues.map((e) => e.message).join("; ");
      result.rows.push({
        row: rowNum,
        name: rawRow.name ?? "(unknown)",
        sku: rawRow.sku ?? "(none)",
        status: "error",
        message: errs,
      });
      result.errors++;
      continue;
    }

    const data = parsed.data;

    const resolvedSku = data.sku.trim();

    const resolvedBarcode = (data.barcode?.trim() || "").length
      ? data.barcode!.trim()
      : generateBarcode();

    // ── Resolve category ────────────────────────────────────────────────────
    let categoryId: string | null = null;
    if (data.category) {
      const key = data.category.toLowerCase().trim();
      categoryId = catMap.get(key) ?? null;

      // Auto-create category if not found
      if (!categoryId) {
        const newCat = await prisma.category.create({
          data: { name: data.category.trim(), branchId: ctx.branchId },
        });
        categoryId = newCat.id;
        catMap.set(key, newCat.id);
      }
    }

    const productData = {
      name: data.name.trim(),
      sku: resolvedSku,
      barcode: resolvedBarcode || null,
      price: data.price,
      lastPrice: data.lastPrice ?? 0,
      costPrice: data.costPrice ?? 0,
      costPriceInclTax: data.costPriceInclTax ?? 0, // ← new: incl. tax
      purchaseTaxRate: data.purchaseTaxRate ?? 0, // ← new
      isActive: data.isActive ?? true,
      discountRate: data.discountRate ?? 0,
      taxRate: data.taxRate ?? 0,
      imageUrl: data.imageUrl?.trim() || null,
      categoryId,
      branchId: ctx.branchId,
    };

    const existingId = skuMap.get(resolvedSku.toLowerCase().trim());

    try {
      if (existingId) {
        // ── Duplicate SKU ─────────────────────────────────────────────────
        if (strategy === "skip") {
          result.rows.push({
            row: rowNum,
            name: data.name,
            sku: resolvedSku,
            status: "skipped",
            message: "SKU already exists — skipped",
          });
          result.skipped++;
          continue;
        }

        // Update existing product
        await prisma.product.update({
          where: { id: existingId },
          data: productData,
        });

        // Update stock if provided
        if (data.quantity !== undefined) {
          await prisma.stock.upsert({
            where: { productId: existingId },
            create: {
              productId: existingId,
              branchId: ctx.branchId,
              quantity: data.quantity,
              lowStockAt: data.lowStockAt ?? 10,
            },
            update: {
              quantity: data.quantity,
              lowStockAt: data.lowStockAt ?? 10,
            },
          });
        }

        result.rows.push({
          row: rowNum,
          name: data.name,
          sku: resolvedSku,
          status: "updated",
          message: "Updated existing product",
        });
        result.updated++;
      } else {
        // ── New product ───────────────────────────────────────────────────
        const product = await prisma.product.create({
          data: productData,
        });

        // Always create stock for new products
        await prisma.stock.create({
          data: {
            productId: product.id,
            branchId: ctx.branchId,
            quantity: data.quantity ?? 0,
            lowStockAt: data.lowStockAt ?? 10,
          },
        });

        skuMap.set(resolvedSku.toLowerCase().trim(), product.id);

        result.rows.push({
          row: rowNum,
          name: data.name,
          sku: resolvedSku,
          status: "created",
          message: "Created successfully",
        });
        result.created++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      result.rows.push({
        row: rowNum,
        name: data.name,
        sku: data.sku,
        status: "error",
        message: msg,
      });
      result.errors++;
    }
  }

  if (result.created > 0 || result.updated > 0) {
    await logActivity({
      action: ActivityAction.PRODUCT_CREATED,
      entity: "Product",
      entityLabel: `Bulk import`,
      meta: {
        total: result.total,
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors,
      },
    });

    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/inventory");
  }

  result.success = result.errors < result.total;
  return result;
};
