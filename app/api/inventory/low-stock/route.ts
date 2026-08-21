import { resolveBranchContext } from "@/lib/branch-context";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const ctx = await resolveBranchContext();
    if (!ctx)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    // Filter in JS since Prisma can't compare two fields directly
    const lowStock = await prisma.$queryRaw<
      { id: string; productId: string; quantity: number; lowStockAt: number }[]
    >`
      SELECT id, "productId", quantity, "lowStockAt"
      FROM "Stock"
      WHERE quantity <= "lowStockAt"
      ORDER BY quantity ASC
    `;

    const lowStockIds = new Set(lowStock.map((s) => s.productId));

    const result = await prisma.stock.findMany({
      where: { branchId: ctx.branchId, productId: { in: [...lowStockIds] } },
      include: { product: { include: { category: true } } },
      orderBy: { quantity: "asc" },
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch low stock" },
      { status: 500 },
    );
  }
}
