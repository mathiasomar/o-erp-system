import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: { select: { orders: true } },
        pointLogs: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        orders: {
          include: { payment: true, items: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(customer);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch customer" },
      { status: 500 },
    );
  }
};
