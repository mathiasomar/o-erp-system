import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
    const logs = await prisma.stockLog.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch logs" },
      { status: 500 },
    );
  }
}
