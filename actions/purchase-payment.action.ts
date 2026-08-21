"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireBranchContext } from "@/lib/branch-context";
import { logActivity } from "@/lib/activity-logger";
import { ActivityAction } from "@/generated/prisma/enums";

const purchasePaymentSchema = z.object({
  purchaseId: z.string(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  method: z.enum(["CASH", "MPESA", "CARD", "BANK_TRANSFER"]),
  reference: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export type PurchasePaymentValues = z.infer<typeof purchasePaymentSchema>;

export type PurchasePaymentResult = 
  | { success: true; payment: any }
  | { success: false; error: string | Record<string, string[]> };

export const createPurchasePayment = async (values: PurchasePaymentValues): Promise<PurchasePaymentResult> => {
  const ctx = await requireBranchContext();
  const parsed = purchasePaymentSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  // Get the purchase to check balance
  const purchase = await prisma.purchase.findUnique({
    where: { id: parsed.data.purchaseId, branchId: ctx.branchId },
  });

  if (!purchase) {
    return { success: false, error: { purchaseId: ["Purchase not found"] } };
  }

  if (purchase.status === "CANCELLED") {
    return { success: false, error: { purchaseId: ["Cannot pay for cancelled purchase"] } };
  }

  // Calculate total paid so far
  const existingPayments = await prisma.purchasePayment.findMany({
    where: { purchaseId: parsed.data.purchaseId },
  });
  const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
  const newTotalPaid = totalPaid + parsed.data.amount;

  if (newTotalPaid > purchase.total) {
    return { 
      success: false, 
      error: { amount: [`Payment exceeds balance. Remaining: KES ${(purchase.total - totalPaid).toFixed(2)}`] } 
    };
  }

  // Create payment
  const payment = await prisma.purchasePayment.create({
    data: {
      ...parsed.data,
      reference: parsed.data.reference || null,
      note: parsed.data.note || null,
    },
  });

  // Update purchase payment status
  let newPaymentStatus: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";
  if (newTotalPaid >= purchase.total) {
    newPaymentStatus = "PAID";
  } else if (newTotalPaid > 0) {
    newPaymentStatus = "PARTIAL";
  }

  await prisma.purchase.update({
    where: { id: parsed.data.purchaseId },
    data: {
      paymentStatus: newPaymentStatus,
      balanceDue: purchase.total - newTotalPaid,
    },
  });

  await logActivity({
    action: ActivityAction.PURCHASE_CREATED, // Using existing action, could add new one
    entity: "PurchasePayment",
    entityId: payment.id,
    entityLabel: `Payment for ${purchase.purchaseNumber}`,
    userId: ctx.userId,
    branchId: ctx.branchId,
    meta: { amount: parsed.data.amount, method: parsed.data.method },
  });

  revalidatePath("/dashboard/purchases");
  return { success: true, payment };
};

export const deletePurchasePayment = async (id: string): Promise<PurchasePaymentResult> => {
  const ctx = await requireBranchContext();

  const payment = await prisma.purchasePayment.findUnique({
    where: { id },
    include: { purchase: true },
  });

  if (!payment) {
    return { success: false, error: "Payment not found" };
  }

  if (payment.purchase.branchId !== ctx.branchId) {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.purchasePayment.delete({ where: { id } });

  // Recalculate purchase payment status
  const remainingPayments = await prisma.purchasePayment.findMany({
    where: { purchaseId: payment.purchaseId },
  });
  const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);

  let newPaymentStatus: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";
  if (totalPaid >= payment.purchase.total) {
    newPaymentStatus = "PAID";
  } else if (totalPaid > 0) {
    newPaymentStatus = "PARTIAL";
  }

  await prisma.purchase.update({
    where: { id: payment.purchaseId },
    data: {
      paymentStatus: newPaymentStatus,
      balanceDue: payment.purchase.total - totalPaid,
    },
  });

  revalidatePath("/dashboard/purchases");
  return { success: true, payment };
};
