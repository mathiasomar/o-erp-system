"use server";

import {
  ActivityAction,
  NotificationType,
  StockAdjustmentReason,
} from "@/generated/prisma/enums";
import { logActivity } from "@/lib/activity-logger";
import { notify } from "@/lib/notify";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireBranchContext } from "@/lib/branch-context";

type NotificationPayload = {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  roles?: string[];
  meta?: Record<string, string | number | boolean | null>;
};

const adjustSchema = z.object({
  productId: z.string(),
  change: z.number().int(),
  reason: z.enum([
    "RESTOCK",
    "MANUAL_INCREASE",
    "MANUAL_DECREASE",
    "DAMAGED",
    "RETURNED",
    "EXPIRED",
  ]),
  note: z.string().optional(),
});

export type AdjustStockInput = z.infer<typeof adjustSchema>;

export type BulkAdjustItem = {
  productId: string;
  change: number;
  reason: string;
  note?: string;
};

// ── Single adjustment ─────────────────────────────────────────────────────────

export const adjustStock = async (input: AdjustStockInput) => {
  const ctx = await requireBranchContext();
  const parsed = adjustSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const { productId, change, reason, note } = parsed.data;

  // Scope stock lookup to branch — prevents cross-branch stock tampering
  const stock = await prisma.stock.findFirst({
    where: { productId, branchId: ctx.branchId },
    include: { product: { select: { name: true, sku: true } } },
  });
  if (!stock) {
    return { success: false, error: { root: ["Stock record not found"] } };
  }

  const newQty = stock.quantity + change;
  if (newQty < 0) {
    return { success: false, error: { root: ["Stock cannot go below zero"] } };
  }

  const notifications: NotificationPayload[] = [];

  await prisma.$transaction(async (tx) => {
    await tx.stock.update({
      where: { id: stock.id },
      data: { quantity: newQty },
    });

    if (newQty === 0) {
      notifications.push({
        type: NotificationType.OUT_OF_STOCK,
        title: "Product out of stock",
        message: `${stock.product?.name ?? productId} is now out of stock`,
        link: `/dashboard/inventory`,
        roles: ["ADMIN", "MANAGER"],
        meta: {
          productId: stock.productId,
          productName: stock.product?.name ?? productId,
          branchId: ctx.branchId,
        },
      });
    } else if (newQty <= stock.lowStockAt) {
      notifications.push({
        type: NotificationType.LOW_STOCK,
        title: "Low stock alert",
        message: `${stock.product?.name ?? productId} has ${newQty} units left`,
        link: `/dashboard/inventory`,
        roles: ["ADMIN", "MANAGER"],
        meta: {
          productId: stock.productId,
          productName: stock.product?.name ?? productId,
          sku: stock.product?.sku ?? "",
          quantity: newQty,
          threshold: stock.lowStockAt,
          branchId: ctx.branchId,
          branchName: "",
        },
      });
    }

    await tx.stockLog.create({
      data: {
        stockId: stock.id,
        productId: stock.productId,
        reason,
        quantityBefore: stock.quantity,
        quantityAfter: newQty,
        change,
        note: note || null,
      },
    });
  });

  await Promise.all(notifications.map((payload) => notify(payload)));

  await logActivity({
    action: ActivityAction.STOCK_ADJUSTED,
    entity: "Stock",
    entityId: productId,
    entityLabel: stock.product?.name ?? productId,
    userId: ctx.userId,
    branchId: ctx.branchId,
    meta: {
      change: change,
      before: stock.quantity,
      after: newQty,
      reason,
    },
  });

  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/products");
  return { success: true, newQuantity: newQty };
};

// ── Bulk adjustment ────────────────────────────────────────────────────────────

export const bulkAdjustStock = async (
  items: BulkAdjustItem[],
  sharedReason: StockAdjustmentReason | string,
  sharedNote?: string,
) => {
  const ctx = await requireBranchContext();
  const validItems = items.filter((i) => i.change !== 0);

  const results = await Promise.allSettled(
    validItems.map(async (item) => {
      // Scope stock lookup to branch
      const stock = await prisma.stock.findFirst({
        where: { productId: item.productId, branchId: ctx.branchId },
        include: { product: { select: { name: true } } },
      });
      if (!stock) throw new Error(`No stock record for product in this branch`);

      const newQty = stock.quantity + item.change;
      if (newQty < 0) throw new Error(`Stock cannot go below zero`);

      const notifications: NotificationPayload[] = [];

      await prisma.$transaction(async (tx) => {
        await tx.stock.update({
          where: { id: stock.id },
          data: { quantity: newQty },
        });

        if (newQty === 0) {
          notifications.push({
            type: NotificationType.OUT_OF_STOCK,
            title: "Product out of stock",
            message: `${stock.product?.name ?? item.productId} is now out of stock`,
            link: `/dashboard/inventory`,
            roles: ["ADMIN", "MANAGER"],
            meta: {
              productId: stock.productId,
              productName: stock.product?.name ?? item.productId,
              branchId: ctx.branchId,
            },
          });
        } else if (newQty <= stock.lowStockAt) {
          notifications.push({
            type: NotificationType.LOW_STOCK,
            title: "Low stock alert",
            message: `${stock.product?.name ?? item.productId} has ${newQty} units left`,
            link: `/dashboard/inventory`,
            roles: ["ADMIN", "MANAGER"],
            meta: {
              productId: stock.productId,
              quantity: newQty,
              branchId: ctx.branchId,
            },
          });
        }

        await tx.stockLog.create({
          data: {
            stockId: stock.id,
            productId: stock.productId,
            reason: (item.reason as StockAdjustmentReason) || sharedReason,
            quantityBefore: stock.quantity,
            quantityAfter: newQty,
            change: item.change,
            note: item.note || sharedNote || null,
          },
        });
      });

      await Promise.all(notifications.map((payload) => notify(payload)));

      return { productId: item.productId, newQty };
    }),
  );

  await logActivity({
    action: ActivityAction.STOCK_BULK_ADJUSTED,
    entity: "Stock",
    entityLabel: `${validItems.length} product(s)`,
    userId: ctx.userId,
    branchId: ctx.branchId,
    meta: { count: validItems.length, reason: sharedReason },
  });

  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/products");

  return results.map((r, i) => ({
    productId: validItems[i]?.productId,
    success: r.status === "fulfilled",
    message:
      r.status === "rejected"
        ? r.reason instanceof Error
          ? r.reason.message
          : "Failed"
        : undefined,
  }));
};
