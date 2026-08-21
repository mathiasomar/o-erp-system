import { OrderStatus } from "@/generated/prisma/enums";
import { resolveBranchContext } from "@/lib/branch-context";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    const ctx = await resolveBranchContext();
    if (!ctx)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const orders = await prisma.order.findMany({
      where: {
        branchId: ctx.branchId,
        ...(status && { status: status as OrderStatus }),
        ...(search && {
          OR: [
            { orderNumber: { contains: search, mode: "insensitive" } },
            {
              payment: {
                splitPayments: {
                  some: { mpesaRef: { contains: search, mode: "insensitive" } },
                },
              },
            },
          ],
        }),
        ...(from || to
          ? {
              createdAt: {
                ...(from && { gte: new Date(from) }),
                ...(to && { lte: new Date(to) }),
              },
            }
          : {}),
      },
      include: {
        items: true,
        payment: {
          include: {
            splitPayments: { orderBy: { createdAt: "desc" } },
          },
        },
        customer: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
