"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { ActivityAction, NotificationType } from "@/generated/prisma/enums";
import { notify } from "@/lib/notify";
import { awardOrderPoints } from "@/actions/customer.action";
import { requireBranchContext } from "@/lib/branch-context";
import { createReceiptFromOrder } from "./receipt.action";

// ── Single payment line schema ────────────────────────────────────────────────

const splitPaymentSchema = z.object({
  method: z.enum(["CASH", "MPESA", "CARD"]),
  amount: z.number().min(0.01),
  mpesaRef: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
  mpesaPhone: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
});

export type SplitPaymentInput = z.infer<typeof splitPaymentSchema>;

// ── Schema — added change and amountPaid fields ─────────────────────────────

const orderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        productName: z.string(),
        sku: z.string(),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
        isCustomPrice: z.boolean().optional(),
      }),
    )
    .min(1, "Cart is empty"),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  note: z.string().optional(),
  payments: z.array(splitPaymentSchema).min(1, "At least one payment required"),
  customerId: z.string().optional(),
  change: z.number().min(0).default(0),
  amountPaid: z.number().min(0).optional(),
});

const normalizeOrderInput = (input: unknown) => {
  if (!input || typeof input !== "object") {
    return input;
  }

  const candidate = input as Record<string, unknown>;
  const payments = candidate.payments;
  const payment = candidate.payment;

  if (Array.isArray(payments)) {
    return candidate;
  }

  if (payment && typeof payment === "object") {
    const paymentCandidate = payment as Record<string, unknown>;
    return {
      ...candidate,
      payments: [
        {
          method: paymentCandidate.method,
          amount: paymentCandidate.amount,
          mpesaRef: paymentCandidate.mpesaRef ?? null,
          mpesaPhone: paymentCandidate.mpesaPhone ?? null,
        },
      ],
    };
  }

  return candidate;
};

export type CreateOrderInput = z.infer<typeof orderSchema>;

// ── Generate order number scoped to branch ────────────────────────────────────

const generateOrderNumber = async (branchId: string): Promise<string> => {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { code: true },
  });
  const count = await prisma.order.count({ where: { branchId } });
  const prefix = branch?.code?.slice(0, 6).toUpperCase() ?? "ORD";
  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
};

// ── Determine status from payments ────────────────────────────────────────────

const resolveStatus = (
  payments: SplitPaymentInput[],
): "COMPLETED" | "PENDING" => {
  const hasPendingMpesa = payments.some(
    (p) => p.method === "MPESA" && !p.mpesaRef?.trim(),
  );
  return hasPendingMpesa ? "PENDING" : "COMPLETED";
};

// ── Create order ──────────────────────────────────────────────────────────────

export const createOrder = async (input: CreateOrderInput) => {
  const ctx = await requireBranchContext();
  const normalizedInput = normalizeOrderInput(input);
  const parsed = orderSchema.safeParse(normalizedInput);

  if (!parsed.success) {
    console.error("Validation error:", parsed.error.flatten().fieldErrors);
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const { items, payments, ...orderData } = parsed.data;

  // Calculate totals
  const paymentsTotal = payments.reduce((s, p) => s + p.amount, 0);
  const totalPaid = orderData.amountPaid ?? paymentsTotal;
  const changeAmount = orderData.change ?? 0;
  const orderTotal = parsed.data.total;

  // Validate that payments total is at least the order total
  if (paymentsTotal < orderTotal - 0.01) {
    return {
      success: false,
      error: {
        root: [
          `Payment total KES ${paymentsTotal.toLocaleString()} ` +
            `is less than order total KES ${orderTotal.toLocaleString()}`,
        ],
      },
    };
  }

  // Validate that change amount is correct (if provided)
  if (changeAmount > 0) {
    const calculatedChange = paymentsTotal - orderTotal;
    if (Math.abs(calculatedChange - changeAmount) > 0.01) {
      return {
        success: false,
        error: {
          root: [
            `Change amount KES ${changeAmount.toLocaleString()} ` +
              `does not match calculated change KES ${calculatedChange.toLocaleString()}`,
          ],
        },
      };
    }
  }

  try {
    const order = await prisma.$transaction(
      async (tx) => {
        // ── Validate stock and prices ─────────────────────────────────────────
        for (const item of items) {
          const stock = await tx.stock.findUnique({
            where: { productId: item.productId },
          });
          if (!stock) {
            throw new Error(
              `No stock record for "${item.productName}". Contact your administrator.`,
            );
          }
          if (stock.quantity === 0) {
            throw new Error(`"${item.productName}" is out of stock.`);
          }
          if (stock.quantity < item.quantity) {
            throw new Error(
              `Insufficient stock for "${item.productName}". ` +
                `Requested: ${item.quantity}, Available: ${stock.quantity}.`,
            );
          }

          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { price: true, lastPrice: true, name: true },
          });

          if (!product) continue;

          const minPrice = product.lastPrice > 0 ? product.lastPrice : 0;
          const maxPrice = product.price;

          // Price must be between lastPrice (or 0) and the standard price
          if (item.unitPrice > maxPrice) {
            throw new Error(
              `Price for "${item.productName}" (KES ${item.unitPrice.toLocaleString()}) ` +
                `exceeds the standard price of KES ${maxPrice.toLocaleString()}.`,
            );
          }

          if (minPrice > 0 && item.unitPrice < minPrice) {
            throw new Error(
              `Price for "${item.productName}" (KES ${item.unitPrice.toLocaleString()}) ` +
                `is below the minimum allowed price of KES ${minPrice.toLocaleString()}.`,
            );
          }

          // Log custom price if present
          if (item.isCustomPrice) {
            console.log(
              `Custom price for ${item.productName}: ${item.unitPrice}`,
            );
          }
        }

        // ── Create order ───────────────────────────────────────────────────────
        const orderNumber = await generateOrderNumber(ctx.branchId);
        const status = resolveStatus(payments);

        // Build note with change information
        // let orderNote = orderData.note || "";
        // if (changeAmount > 0) {
        //   orderNote = orderNote
        //     ? `${orderNote} | Change: KES ${changeAmount.toLocaleString()}`
        //     : `Change: KES ${changeAmount.toLocaleString()}`;
        // }

        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            subtotal: orderData.subtotal,
            discount: orderData.discount,
            tax: orderData.tax,
            total: orderData.total,
            amountPaid: totalPaid,
            change: changeAmount,
            note: orderData.note || null,
            userId: ctx.userId,
            branchId: ctx.branchId,
            status,
            customerId: parsed.data.customerId ?? null,
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                productName: item.productName,
                sku: item.sku,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.unitPrice * item.quantity,
              })),
            },
            payment: {
              create: {
                amount: totalPaid,
                splitPayments: {
                  create: payments.map((p) => ({
                    method: p.method,
                    amount: p.amount,
                    mpesaRef: p.mpesaRef || null,
                    mpesaPhone: p.mpesaPhone || null,
                  })),
                },
              },
            },
          },
          include: {
            items: true,
            payment: {
              include: { splitPayments: { orderBy: { amount: "desc" } } },
            },
          },
        });

        // ── Decrement stock ────────────────────────────────────────────────────
        for (const item of items) {
          await tx.stock.update({
            where: { productId: item.productId },
            data: { quantity: { decrement: item.quantity } },
          });
        }

        // Save manual M-Pesa transactions
        const manualMpesaPayments = payments.filter(
          (p) => p.method === "MPESA" && p.mpesaRef,
        );

        if (manualMpesaPayments.length > 0) {
          // Check for existing refs in one query to avoid duplicates
          const existingRefs = await tx.mpesaTransaction.findMany({
            where: {
              mpesaReceiptNumber: {
                in: manualMpesaPayments.map((p) => p.mpesaRef!),
              },
            },
            select: { mpesaReceiptNumber: true },
          });

          const existingRefSet = new Set(
            existingRefs.map((r) => r.mpesaReceiptNumber),
          );

          // Create all missing manual transactions in parallel
          await Promise.all(
            manualMpesaPayments
              .filter((p) => !existingRefSet.has(p.mpesaRef!))
              .map((p) =>
                tx.mpesaTransaction.create({
                  data: {
                    checkoutRequestId: `MANUAL-${newOrder.id}-${p.mpesaRef}`,
                    merchantRequestId: `MANUAL-${newOrder.id}`,
                    phoneNumber: p.mpesaPhone ?? "",
                    amount: p.amount,
                    status: "SUCCESS",
                    mpesaReceiptNumber: p.mpesaRef!,
                    resultDesc: "Manual entry by cashier",
                    branchId: ctx.branchId ?? null,
                  },
                }),
              ),
          );
        }

        return newOrder;
      },
      { timeout: 15000 },
    );

    createReceiptFromOrder(order.id).catch((err) =>
      console.error("[Receipt] Failed to auto-create receipt:", err),
    );

    // ── Log activity ─────────────────────────────────────────────────────────

    await logActivity({
      action: ActivityAction.ORDER_CREATED,
      entity: "Order",
      entityId: order.id,
      entityLabel: order.orderNumber,
      userId: ctx.userId,
      branchId: ctx.branchId,
      meta: {
        total: order.total,
        items: order.items.length,
        methods: payments.map((p) => p.method).join("+"),
        change: changeAmount,
        amountPaid: totalPaid,
      },
    });

    // ── Award points if customer exists ──────────────────────────────────────
    if (order.customerId && order.status === "COMPLETED") {
      await awardOrderPoints(order.customerId, order.id, order.total);
    }

    // ── Send notification ─────────────────────────────────────────────────────
    await notify({
      type: NotificationType.NEW_ORDER,
      title: "New order placed",
      message: `${order.orderNumber} — KES ${order.total.toLocaleString()}`,
      link: `/dashboard/orders/${order.id}`,
      roles: ["ADMIN", "MANAGER"],
      meta: {
        orderNumber: order.orderNumber,
        total: order.total,
        methods: payments.map((p) => p.method).join("+"),
        cashier: ctx.userId,
        branchId: ctx.branchId,
        change: changeAmount,
        amountPaid: totalPaid,
        items: order.items.map((item) => ({
          name: item.productName,
          qty: item.quantity,
          price: item.unitPrice,
        })),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/products");
    return { success: true, order };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create order";
    console.error("Order creation error:", error);
    return { success: false, error: { root: [message] } };
  }
};

// ── Cancel order ──────────────────────────────────────────────────────────────

export const cancelOrder = async (id: string) => {
  const ctx = await requireBranchContext();

  const order = await prisma.order.findUnique({
    where: { id, branchId: ctx.branchId },
    include: { items: true },
  });
  if (!order) return { success: false, error: "Order not found" };
  if (order.status === "CANCELLED") {
    return { success: false, error: "Order already cancelled" };
  }

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.stock.update({
        where: { productId: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
    }
    await tx.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  });

  await logActivity({
    action: ActivityAction.ORDER_CANCELLED,
    entity: "Order",
    entityId: order.id,
    entityLabel: order.orderNumber,
    userId: ctx.userId,
    branchId: ctx.branchId,
    meta: { reason: "Manual cancellation" },
  });

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/products");
  return { success: true };
};

export const voidOrder = async (id: string, reason: string) => {
  const ctx = await requireBranchContext();

  const order = await prisma.order.findUnique({
    where: { id, branchId: ctx.branchId },
    include: { items: true },
  });
  if (!order) return { success: false, error: "Order not found" };
  if (order.status === "VOIDED") {
    return { success: false, error: "Order already voided" };
  }
  if (order.status === "CANCELLED") {
    return { success: false, error: "Cannot void a cancelled order" };
  }

  await prisma.$transaction(async (tx) => {
    // Return stock for every item
    for (const item of order.items) {
      await tx.stock.update({
        where: { productId: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
    }
    // Mark as voided
    await tx.order.update({
      where: { id },
      data: { status: "VOIDED" },
    });
  });

  await logActivity({
    action: ActivityAction.ORDER_CANCELLED, // reuse existing enum
    entity: "Order",
    entityId: order.id,
    entityLabel: order.orderNumber,
    userId: ctx.userId,
    branchId: ctx.branchId,
    meta: {
      reason,
      type: "VOID",
      items: order.items.length,
      total: order.total,
    },
  });

  await notify({
    type: NotificationType.ORDER_CANCELLED, // reuse existing enum
    title: "Order voided",
    message: `${order.orderNumber} — KES ${order.total.toLocaleString()}`,
    link: `/dashboard/orders/${order.id}`,
    roles: ["ADMIN", "MANAGER"],
    meta: {
      orderNumber: order.orderNumber,
      total: order.total,
      reason,
      cashier: ctx.userId,
      branchId: ctx.branchId,
      items: order.items.map((item) => ({
        name: item.productName,
        qty: item.quantity,
        price: item.unitPrice,
      })),
    },
  });

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/receipts");
  revalidatePath("/dashboard/inventory");
  return { success: true };
};
