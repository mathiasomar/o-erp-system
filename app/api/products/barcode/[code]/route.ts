import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveBranchContext } from "@/lib/branch-context";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const ctx = await resolveBranchContext();
    if (!ctx) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { code } = await params;

    // barcode + branchId together — use findFirst since it's not a
    // unique constraint by itself (only sku+branchId is compound unique)
    const product = await prisma.product.findFirst({
      where: {
        barcode: code,
        branchId: ctx.branchId,
      },
      include: { category: true, stock: true },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(product);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch product" },
      { status: 500 },
    );
  }
}
