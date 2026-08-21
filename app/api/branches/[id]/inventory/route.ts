import { NextRequest, NextResponse } from "next/server";
import { resolveBranchContext } from "@/lib/branch-context";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const ctx = await resolveBranchContext();
    if (!ctx) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const stocks = await prisma.stock.findMany({
      where: { branchId: id },
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: { product: { name: "asc" } },
    });

    return NextResponse.json(stocks);
  } catch {
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
};
