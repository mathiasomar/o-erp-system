import { NextRequest, NextResponse } from "next/server";
import { resolveBranchContext } from "@/lib/branch-context";
import prisma from "@/lib/prisma";
import { subDays, startOfDay } from "date-fns";

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
    const now = new Date();
    const last30 = startOfDay(subDays(now, 29));

    const [
      totalOrders,
      revenueAll,
      last30Orders,
      revenue30,
      totalExpenses,
      stockSummary,
      topProducts,
      pendingOrders,
    ] = await Promise.all([
      prisma.order.count({
        where: { branchId: id, status: "COMPLETED" },
      }),
      prisma.order.aggregate({
        where: { branchId: id, status: "COMPLETED" },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: {
          branchId: id,
          status: "COMPLETED",
          createdAt: { gte: last30 },
        },
      }),
      prisma.order.aggregate({
        where: {
          branchId: id,
          status: "COMPLETED",
          createdAt: { gte: last30 },
        },
        _sum: { total: true },
      }),
      prisma.expense.aggregate({
        where: { branchId: id },
        _sum: { amount: true },
      }),
      prisma.stock.aggregate({
        where: { branchId: id },
        _count: { id: true },
        _sum: { quantity: true },
      }),
      prisma.orderItem.groupBy({
        by: ["productId", "productName"],
        where: { order: { branchId: id, status: "COMPLETED" } },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: "desc" } },
        take: 5,
      }),
      prisma.order.count({
        where: { branchId: id, status: "PENDING" },
      }),
    ]);

    return NextResponse.json({
      totalOrders,
      totalRevenue: revenueAll._sum.total ?? 0,
      last30Orders,
      revenue30: revenue30._sum.total ?? 0,
      totalExpenses: totalExpenses._sum.amount ?? 0,
      productCount: stockSummary._count.id,
      totalStock: stockSummary._sum.quantity ?? 0,
      pendingOrders,
      topProducts: topProducts.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        units: p._sum.quantity ?? 0,
        revenue: p._sum.total ?? 0,
      })),
    });
  } catch {
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
};
