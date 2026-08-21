import { resolveBranchContext } from "@/lib/branch-context";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const ctx = await resolveBranchContext();
    if (!ctx)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const inventory = await prisma.stock.findMany({
      where: { branchId: ctx.branchId },
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: { quantity: "asc" },
    });
    return NextResponse.json(inventory);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch inventory" },
      { status: 500 },
    );
  }
}
