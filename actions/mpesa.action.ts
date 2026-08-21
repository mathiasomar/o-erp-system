"use server";

import { requireBranchContext } from "@/lib/branch-context";
import { initiateStkPush, formatPhone } from "@/lib/mpesa";
import prisma from "@/lib/prisma";
import { z } from "zod";

const stkSchema = z.object({
  phone: z.string().min(9, "Invalid phone number"),
  amount: z.number().min(1, "Amount must be at least 1"),
  orderNumber: z.string(),
});

export type InitiateMpesaInput = z.infer<typeof stkSchema>;

export const initiateMpesaPayment = async (input: InitiateMpesaInput) => {
  const ctx = await requireBranchContext();
  const parsed = stkSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  try {
    const phone = formatPhone(parsed.data.phone);
    const stkRes = await initiateStkPush({
      phone,
      amount: parsed.data.amount,
      reference: parsed.data.orderNumber,
      desc: `Payment for ${parsed.data.orderNumber}`,
    });

    if (stkRes.ResponseCode !== "0") {
      return { success: false, error: { root: [stkRes.ResponseDescription] } };
    }

    // Record transaction as PENDING
    const transaction = await prisma.mpesaTransaction.create({
      data: {
        checkoutRequestId: stkRes.CheckoutRequestID,
        merchantRequestId: stkRes.MerchantRequestID,
        phoneNumber: phone,
        branchId: ctx.branchId,
        amount: parsed.data.amount,
        status: "PENDING",
      },
    });

    return {
      success: true,
      checkoutRequestId: stkRes.CheckoutRequestID,
      transactionId: transaction.id,
    };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "M-Pesa request failed";
    return { success: false, error: { root: [msg] } };
  }
};

export const getMpesaStatus = async (checkoutRequestId: string) => {
  const transaction = await prisma.mpesaTransaction.findUnique({
    where: { checkoutRequestId },
  });
  if (!transaction) return { status: "NOT_FOUND" };
  return {
    status: transaction.status,
    mpesaReceiptNumber: transaction.mpesaReceiptNumber,
    resultDesc: transaction.resultDesc,
  };
};
