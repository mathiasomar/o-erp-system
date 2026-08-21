import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveBranchContext } from "@/lib/branch-context";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    const ctx = await resolveBranchContext();
    if (!ctx)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const search = searchParams.get("search") ?? undefined;

    const purchases = await prisma.purchase.findMany({
      where: {
        branchId: ctx.branchId,
        ...(status && status !== "ALL" && { status: status as never }),
        ...(search && {
          OR: [
            { purchaseNumber: { contains: search, mode: "insensitive" } },
            { invoiceNumber: { contains: search, mode: "insensitive" } },
            { supplier: { name: { contains: search, mode: "insensitive" } } },
          ],
        }),
      },
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        user: { select: { id: true, name: true } },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
        payments: {
          orderBy: { paidAt: "desc" },
        },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(purchases);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
};
