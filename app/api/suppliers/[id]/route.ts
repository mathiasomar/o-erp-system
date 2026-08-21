import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;

  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: { select: { purchases: true } },
        purchases: {
          include: { items: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { message: "Supplier not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(supplier);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch supplier" },
      { status: 500 },
    );
  }
};
