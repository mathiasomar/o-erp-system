import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { notify } from "@/lib/notify";
import { NotificationType } from "@/generated/prisma/enums";

interface MpesaMetadataItem {
  Name: string;
  Value: string | number;
}

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const stk = body?.Body?.stkCallback;

    if (!stk) {
      return NextResponse.json(
        { message: "Invalid callback" },
        { status: 400 },
      );
    }

    const checkoutRequestId = stk.CheckoutRequestID;
    // const merchantRequestId = stk.MerchantRequestID;
    const resultCode = stk.ResultCode;
    const resultDesc = stk.ResultDesc;

    // Extract M-Pesa receipt from metadata
    const metadata: MpesaMetadataItem[] = stk.CallbackMetadata?.Item ?? [];
    const getValue = (name: string) =>
      metadata.find((i: MpesaMetadataItem) => i.Name === name)?.Value ?? null;

    const mpesaReceiptNumber = getValue("MpesaReceiptNumber");
    const amount = Number(getValue("Amount") ?? 0);
    const phone = getValue("PhoneNumber")?.toString() ?? null;
    const receiptNumber = mpesaReceiptNumber?.toString() ?? null;

    const isSuccess = resultCode === 0;

    // Update the transaction record
    await prisma.mpesaTransaction.updateMany({
      where: { checkoutRequestId },
      data: {
        status: isSuccess ? "SUCCESS" : "FAILED",
        resultCode,
        resultDesc,
        mpesaReceiptNumber: mpesaReceiptNumber?.toString() ?? null,
        updatedAt: new Date(),
      },
    });

    if (resultCode === 0) {
      await notify({
        type: NotificationType.MPESA_SUCCESS,
        title: "M-Pesa payment received",
        message: `KES ${amount.toLocaleString()} from ${phone}`,
        link: `/dashboard/payments/mpesa`,
        roles: ["ADMIN", "MANAGER", "CASHIER"],
        meta: { amount, phone, receiptNumber },
      });
    } else {
      await notify({
        type: NotificationType.MPESA_FAILED,
        title: "M-Pesa payment failed",
        message: resultDesc,
        link: `/dashboard/payments/mpesa`,
        roles: ["ADMIN", "MANAGER"],
      });
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    // Always return 200 to Safaricom even on errors
  }
};
