import { resolveBranchContext } from "@/lib/branch-context";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const method = searchParams.get("method") ?? undefined;
    const frequency = searchParams.get("frequency") ?? undefined;
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    const ctx = await resolveBranchContext();
    if (!ctx)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const branchWhere = { branchId: ctx.branchId };

    const expenses = await prisma.expense.findMany({
      where: {
        ...branchWhere,
        ...(categoryId && { categoryId }),
        ...(method && { paymentMethod: method as never }),
        ...(frequency && { frequency: frequency as never }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { note: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(from || to
          ? {
              date: {
                ...(from && { gte: new Date(from) }),
                ...(to && { lte: new Date(to) }),
              },
            }
          : {}),
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
    const byMethod = {
      CASH: expenses
        .filter((e) => e.paymentMethod === "CASH")
        .reduce((s, e) => s + e.amount, 0),
      MPESA: expenses
        .filter((e) => e.paymentMethod === "MPESA")
        .reduce((s, e) => s + e.amount, 0),
      CARD: expenses
        .filter((e) => e.paymentMethod === "CARD")
        .reduce((s, e) => s + e.amount, 0),
      BANK_TRANSFER: expenses
        .filter((e) => e.paymentMethod === "BANK_TRANSFER")
        .reduce((s, e) => s + e.amount, 0),
    };
    const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
      const key = e.category?.name ?? "Uncategorised";
      acc[key] = (acc[key] ?? 0) + e.amount;
      return acc;
    }, {});

    return NextResponse.json({ expenses, totalAmount, byMethod, byCategory });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch expenses" },
      { status: 500 },
    );
  }
}
