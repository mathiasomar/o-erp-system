import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { id: true, name: true, role: true } },
        customer: { select: { id: true, name: true, phone: true } },
        voidedBy: { select: { id: true, name: true } },
        order: {
          include: {
            payment: {
              include: { splitPayments: { orderBy: { amount: "desc" } } },
            },
          },
        },
        childReceipts: {
          select: {
            id: true,
            receiptNumber: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
        parentReceipt: {
          select: { id: true, receiptNumber: true, status: true },
        },
        originalReceipt: {
          select: { id: true, receiptNumber: true, createdAt: true },
        },
        duplicates: {
          select: { id: true, receiptNumber: true, createdAt: true },
        },
      },
    });

    if (!receipt)
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json(receipt);
  } catch {
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
};
