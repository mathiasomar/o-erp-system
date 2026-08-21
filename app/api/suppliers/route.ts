import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveBranchContext } from "@/lib/branch-context";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const ctx = await resolveBranchContext();
    if (!ctx)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const suppliers = await prisma.supplier.findMany({
      where: { branchId: ctx.branchId },
      include: { _count: { select: { purchases: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(suppliers);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
};
