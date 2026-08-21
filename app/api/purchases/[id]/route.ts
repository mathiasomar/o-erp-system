import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;

  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true, phone: true, email: true } },
        user: { select: { id: true, name: true } },
        items: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
        payments: true,
        _count: { select: { items: true } },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { message: "Purchase not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(purchase);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch purchase" },
      { status: 500 },
    );
  }
};
