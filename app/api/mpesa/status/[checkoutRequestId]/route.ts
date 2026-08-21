import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ checkoutRequestId: string }> },
) {
  try {
    const { checkoutRequestId } = await context.params;
    const transaction = await prisma.mpesaTransaction.findUnique({
      where: { checkoutRequestId },
    });

    if (!transaction) {
      return NextResponse.json({ status: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({
      status: transaction.status,
      mpesaReceiptNumber: transaction.mpesaReceiptNumber,
      resultDesc: transaction.resultDesc,
      amount: transaction.amount,
      phoneNumber: transaction.phoneNumber,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch status" },
      { status: 500 },
    );
  }
}
