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

    const branchWhere = { branchId: ctx.branchId };

    const transactions = await prisma.mpesaTransaction.findMany({
      where: {
        ...branchWhere,
        ...(status && { status }),
        ...(search && {
          OR: [
            { mpesaReceiptNumber: { contains: search, mode: "insensitive" } },
            { phoneNumber: { contains: search, mode: "insensitive" } },
            { checkoutRequestId: { contains: search, mode: "insensitive" } },
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
      orderBy: { createdAt: "desc" },
    });

    const totalSuccess = transactions
      .filter((t) => t.status === "SUCCESS")
      .reduce((s, t) => s + t.amount, 0);

    const totalPending = transactions.filter(
      (t) => t.status === "PENDING",
    ).length;

    const totalFailed = transactions.filter(
      (t) => t.status === "FAILED",
    ).length;

    return NextResponse.json({
      transactions,
      summary: {
        totalSuccess,
        totalPending,
        totalFailed,
        totalCount: transactions.length,
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch M-Pesa transactions" },
      { status: 500 },
    );
  }
}
