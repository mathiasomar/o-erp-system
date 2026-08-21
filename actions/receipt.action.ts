"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { logActivity } from "@/lib/activity-logger";
import { ActivityAction } from "@/generated/prisma/enums";
import { requireBranchContext } from "@/lib/branch-context";

// ── Helpers ───────────────────────────────────────────────────────────────────

const getSession = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
};

const generateReceiptNumber = async (branchId: string): Promise<string> => {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { code: true },
  });
  const count = await prisma.receipt.count({ where: { branchId } });
  const prefix = branch?.code?.slice(0, 4).toUpperCase() ?? "RCP";
  return `${prefix}-RCP-${String(count + 1).padStart(6, "0")}`;
};

// ── Create receipt from order ─────────────────────────────────────────────────
// Called automatically after createOrder succeeds.

export const createReceiptFromOrder = async (orderId: string) => {
  const ctx = await requireBranchContext();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payment: { include: { splitPayments: true } },
      customer: { select: { id: true } },
    },
  });

  if (!order) return { success: false, error: "Order not found" };

  // Don't create a receipt if one already exists for this order
  const existing = await prisma.receipt.findUnique({ where: { orderId } });
  if (existing) return { success: true, receipt: existing };

  const receiptNumber = await generateReceiptNumber(ctx.branchId);

  const receipt = await prisma.receipt.create({
    data: {
      receiptNumber,
      orderId,
      branchId: ctx.branchId,
      userId: ctx.userId,
      customerId: order.customerId ?? null,
      type: "SALE",
      status: "ACTIVE",
      subtotal: order.subtotal,
      discount: order.discount,
      tax: order.tax,
      total: order.total,
      note: order.note ?? null,
      items: {
        create: order.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      },
    },
    include: { items: true },
  });

  return { success: true, receipt };
};

// ── Void receipt ──────────────────────────────────────────────────────────────
// Voids the receipt AND the linked order, returns stock to inventory.

export const voidReceipt = async (id: string, reason: string) => {
  if (!reason.trim()) {
    return { success: false, error: "Void reason is required" };
  }

  const ctx = await requireBranchContext();
  const session = await getSession();

  const receipt = await prisma.receipt.findUnique({
    where: { id, branchId: ctx.branchId },
    include: {
      items: true,
      order: { include: { items: true } },
    },
  });

  if (!receipt) return { success: false, error: "Receipt not found" };
  if (receipt.status === "VOIDED")
    return { success: false, error: "Receipt is already voided" };
  if (receipt.status === "COMBINED")
    return {
      success: false,
      error: "Cannot void a combined receipt — void the parent instead",
    };

  await prisma.$transaction(async (tx) => {
    // 1. Mark receipt as voided
    await tx.receipt.update({
      where: { id },
      data: {
        status: "VOIDED",
        voidedAt: new Date(),
        voidedById: session?.user?.id ?? null,
        voidReason: reason.trim(),
      },
    });

    // 2. If linked to an order — void the order too
    if (receipt.orderId && receipt.order) {
      await tx.order.update({
        where: { id: receipt.orderId },
        data: { status: "VOIDED" },
      });

      // 3. Return stock for all order items
      for (const item of receipt.order.items) {
        await tx.stock.update({
          where: { productId: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
      }
    }

    // 4. If this was a combined receipt — restore child receipts to ACTIVE
    //    so they can be re-used or re-combined
    if (receipt.type === "COMBINED") {
      await tx.receipt.updateMany({
        where: { parentReceiptId: id },
        data: {
          status: "ACTIVE",
          parentReceiptId: null,
          combinedAt: null,
        },
      });
    }
  });

  await logActivity({
    action: ActivityAction.RECEIPT_VOIDED,
    entity: "Receipt",
    entityId: id,
    entityLabel: receipt.receiptNumber,
    userId: session?.user?.id,
    branchId: ctx.branchId,
    meta: { reason, total: receipt.total, orderId: receipt.orderId },
  });

  revalidatePath("/dashboard/receipts");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/inventory");
  return { success: true };
};

// ── Combine receipts ──────────────────────────────────────────────────────────
// Merges multiple active receipts into one combined receipt.
// The source receipts are marked COMBINED (not voided — stock stays deducted).

const combineSchema = z.object({
  receiptIds: z
    .array(z.string())
    .min(2, "Select at least 2 receipts to combine"),
  note: z.string().optional(),
});

export const combineReceipts = async (receiptIds: string[], note?: string) => {
  const parsed = combineSchema.safeParse({ receiptIds, note });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const ctx = await requireBranchContext();
  const session = await getSession();

  // Fetch all source receipts
  const sources = await prisma.receipt.findMany({
    where: {
      id: { in: receiptIds },
      branchId: ctx.branchId,
      status: "ACTIVE", // can only combine active receipts
      type: { not: "COMBINED" }, // can't combine already-combined
    },
    include: { items: true },
  });

  if (sources.length !== receiptIds.length) {
    return {
      success: false,
      error:
        "Some receipts are not active or not found. Only active receipts can be combined.",
    };
  }

  // Must share the same customer (or all be no-customer)
  const customerIds = [...new Set(sources.map((r) => r.customerId))];
  if (customerIds.length > 1) {
    return {
      success: false,
      error: "All receipts must belong to the same customer to be combined.",
    };
  }

  const combinedTotal = sources.reduce((s, r) => s + r.total, 0);
  const combinedSubtotal = sources.reduce((s, r) => s + r.subtotal, 0);
  const combinedDiscount = sources.reduce((s, r) => s + r.discount, 0);
  const combinedTax = sources.reduce((s, r) => s + r.tax, 0);
  const receiptNumber = await generateReceiptNumber(ctx.branchId);
  const now = new Date();

  const combined = await prisma.$transaction(async (tx) => {
    // 1. Create the combined receipt
    const newReceipt = await tx.receipt.create({
      data: {
        receiptNumber,
        branchId: ctx.branchId,
        userId: ctx.userId,
        customerId: customerIds[0] ?? null,
        type: "COMBINED",
        status: "ACTIVE",
        subtotal: combinedSubtotal,
        discount: combinedDiscount,
        tax: combinedTax,
        total: combinedTotal,
        note:
          note?.trim() ||
          `Combined from: ${sources.map((r) => r.receiptNumber).join(", ")}`,
        // Merge all items from all source receipts
        items: {
          create: sources.flatMap((r) =>
            r.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          ),
        },
      },
      include: { items: true },
    });

    // 2. Mark source receipts as COMBINED, link to parent
    await tx.receipt.updateMany({
      where: { id: { in: receiptIds } },
      data: {
        status: "COMBINED",
        parentReceiptId: newReceipt.id,
        combinedAt: now,
      },
    });

    return newReceipt;
  });

  await logActivity({
    action: ActivityAction.RECEIPT_COMBINED,
    entity: "Receipt",
    entityId: combined.id,
    entityLabel: combined.receiptNumber,
    userId: session?.user?.id,
    branchId: ctx.branchId,
    meta: {
      sourceCount: sources.length,
      total: combinedTotal,
      sources: sources.map((r) => r.receiptNumber).join(", "),
    },
  });

  revalidatePath("/dashboard/receipts");
  return { success: true, receipt: combined };
};

// ── Reprint / duplicate receipt ───────────────────────────────────────────────
// Creates a DUPLICATE receipt record for audit trail.
// Only increments printCount on the original.

export const reprintReceipt = async (id: string) => {
  const ctx = await requireBranchContext();
  const session = await getSession();

  const original = await prisma.receipt.findUnique({
    where: { id, branchId: ctx.branchId },
    include: { items: true },
  });

  if (!original) return { success: false, error: "Receipt not found" };
  if (original.status === "VOIDED") {
    return { success: false, error: "Cannot reprint a voided receipt" };
  }

  const now = new Date();
  const receiptNumber = await generateReceiptNumber(ctx.branchId);

  const [duplicate] = await prisma.$transaction([
    // Create the duplicate receipt record
    prisma.receipt.create({
      data: {
        receiptNumber,
        orderId: original.orderId,
        branchId: ctx.branchId,
        userId: session?.user?.id ?? null,
        customerId: original.customerId ?? null,
        type: "DUPLICATE",
        status: "ACTIVE",
        subtotal: original.subtotal,
        discount: original.discount,
        tax: original.tax,
        total: original.total,
        note: `Reprint of ${original.receiptNumber}`,
        originalReceiptId: original.id,
        items: {
          create: original.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
    }),
    // Increment print count on original
    prisma.receipt.update({
      where: { id },
      data: {
        printCount: { increment: 1 },
        lastPrintedAt: now,
      },
    }),
  ]);

  await logActivity({
    action: ActivityAction.RECEIPT_REPRINTED,
    entity: "Receipt",
    entityId: id,
    entityLabel: original.receiptNumber,
    userId: session?.user?.id,
    branchId: ctx.branchId,
    meta: {
      duplicateReceiptNumber: receiptNumber,
      printCount: original.printCount + 1,
    },
  });

  revalidatePath("/dashboard/receipts");
  return { success: true, receipt: duplicate };
};

// ── Record print ──────────────────────────────────────────────────────────────
// Called each time a receipt is printed from the UI.

export const recordReceiptPrint = async (id: string) => {
  await prisma.receipt.update({
    where: { id },
    data: {
      printCount: { increment: 1 },
      lastPrintedAt: new Date(),
    },
  });
  return { success: true };
};
