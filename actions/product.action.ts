"use server";

import { ActivityAction } from "@/generated/prisma/enums";
import { logActivity } from "@/lib/activity-logger";
import prisma from "@/lib/prisma";
import { ProductFormValues, productSchema } from "@/lib/validations/product";
import { revalidatePath } from "next/cache";
import { requireBranchContext } from "@/lib/branch-context";

export const getAllProducts = async () => {
  const ctx = await requireBranchContext();
  return prisma.product.findMany({
    where: { branchId: ctx.branchId },
    include: { category: true, stock: true },
    orderBy: { createdAt: "desc" },
  });
};

export const getProducts = async (search?: string, categoryId?: string) => {
  const ctx = await requireBranchContext();
  return prisma.product.findMany({
    where: {
      branchId: ctx.branchId,
      isActive: true,
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { barcode: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: { category: true, stock: true },
    orderBy: { name: "asc" },
  });
};

export const getCategories = async () => {
  const ctx = await requireBranchContext();
  return prisma.category.findMany({
    where: { branchId: ctx.branchId },
    orderBy: { name: "asc" },
  });
};

export const createProduct = async (values: ProductFormValues) => {
  const ctx = await requireBranchContext();
  const parsed = productSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const { stock, ...productData } = parsed.data;

  // SKU unique per branch
  const existing = await prisma.product.findUnique({
    where: { sku_branchId: { sku: productData.sku, branchId: ctx.branchId } },
  });
  if (existing) {
    return {
      success: false,
      error: { sku: ["SKU already exists in this branch"] },
    };
  }

  const product = await prisma.product.create({
    data: {
      ...productData,
      branchId: ctx.branchId,
      imageUrl: productData.imageUrl || null,
      barcode: productData.barcode || null,
      stock: {
        create: {
          quantity: stock.quantity,
          lowStockAt: stock.lowStockAt,
          branchId: ctx.branchId,
        },
      },
    },
  });

  await logActivity({
    action: ActivityAction.PRODUCT_CREATED,
    entity: "Product",
    entityId: product.id,
    entityLabel: product.name,
    userId: ctx.userId,
    branchId: ctx.branchId,
    meta: { sku: product.sku, price: product.price },
  });

  revalidatePath("/dashboard/products");
  return { success: true, product };
};

export const updateProduct = async (id: string, values: ProductFormValues) => {
  const ctx = await requireBranchContext();
  const parsed = productSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const { stock, ...productData } = parsed.data;

  // SKU unique per branch — exclude current product
  const existing = await prisma.product.findFirst({
    where: {
      sku: productData.sku,
      branchId: ctx.branchId,
      NOT: { id },
    },
  });
  if (existing) {
    return {
      success: false,
      error: { sku: ["SKU already exists in this branch"] },
    };
  }

  const product = await prisma.product.update({
    where: { id, branchId: ctx.branchId },
    data: {
      ...productData,
      imageUrl: productData.imageUrl || null,
      barcode: productData.barcode || null,
      stock: {
        upsert: {
          create: {
            quantity: stock.quantity,
            lowStockAt: stock.lowStockAt,
            branchId: ctx.branchId,
          },
          update: { lowStockAt: stock.lowStockAt },
        },
      },
    },
  });

  await logActivity({
    action: ActivityAction.PRODUCT_UPDATED,
    entity: "Product",
    entityId: product.id,
    entityLabel: product.name,
    userId: ctx.userId,
    branchId: ctx.branchId,
    meta: { sku: product.sku },
  });

  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${id}`);
  return { success: true, product };
};

export const deleteProducts = async (ids: string[]) => {
  const ctx = await requireBranchContext();

  const products = await prisma.product.findMany({
    where: { id: { in: ids }, branchId: ctx.branchId },
    select: { id: true, name: true },
  });
  const safeIds = products.map((p) => p.id);
  if (safeIds.length === 0) return;

  await prisma.orderItem.deleteMany({ where: { productId: { in: safeIds } } });
  await prisma.stock.deleteMany({ where: { productId: { in: safeIds } } });
  await prisma.product.deleteMany({ where: { id: { in: safeIds } } });

  await logActivity({
    action: ActivityAction.PRODUCT_DELETED,
    entity: "Product",
    entityLabel: `${safeIds.length} product(s)`,
    userId: ctx.userId,
    branchId: ctx.branchId,
    meta: { ids: safeIds.join(",") },
  });

  revalidatePath("/dashboard/products");
};

export const updateDiscount = async (
  productIds: string[],
  discountRate: number,
) => {
  const ctx = await requireBranchContext();
  await prisma.product.updateMany({
    where: { id: { in: productIds }, branchId: ctx.branchId },
    data: { discountRate },
  });
  revalidatePath("/dashboard/products");
};

export const updateTax = async (productIds: string[], taxRate: number) => {
  const ctx = await requireBranchContext();
  await prisma.product.updateMany({
    where: { id: { in: productIds }, branchId: ctx.branchId },
    data: { taxRate },
  });
  revalidatePath("/dashboard/products");
};
