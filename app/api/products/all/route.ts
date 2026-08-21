import { resolveBranchContext } from "@/lib/branch-context";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const ctx = await resolveBranchContext();
  if (!ctx)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const branchWhere = { branchId: ctx.branchId };
  try {
    const products = await prisma.product.findMany({
      where: { ...branchWhere },
      include: { category: true, stock: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
