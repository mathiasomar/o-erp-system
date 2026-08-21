import { resolveBranchContext } from "@/lib/branch-context";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const ctx = await resolveBranchContext();
  if (!ctx)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const branchWhere = { branchId: ctx.branchId };
  try {
    const categories = await prisma.expenseCategory.findMany({
      where: { ...branchWhere },
      orderBy: { name: "asc" },
      include: { _count: { select: { expenses: true } } },
    });
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}
