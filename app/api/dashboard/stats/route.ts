import { NextResponse } from "next/server";
import { resolveBranchContext } from "@/lib/branch-context";
import prisma from "@/lib/prisma";
import { subDays, startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const ctx = await resolveBranchContext();
    if (!ctx)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const branchWhere = { branchId: ctx.branchId };
    const now = new Date();
    const last30 = startOfDay(subDays(now, 29));
    const last7 = startOfDay(subDays(now, 6));

    const [
      totalRevenue,
      totalOrders,
      pendingOrders,
      totalProducts,
      lowStockCount,
      totalExpenses,
      totalCustomers,
      recentOrders,
      revenue30,
      orders30,
      revenue7,
      orders7,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { ...branchWhere, status: "COMPLETED" },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { ...branchWhere, status: "COMPLETED" },
      }),
      prisma.order.count({
        where: { ...branchWhere, status: "PENDING" },
      }),
      prisma.product.count({
        where: { ...branchWhere, isActive: true },
      }),
      prisma.stock.count({
        where: {
          branchId: ctx.branchId,
          quantity: { gt: 0 },
          // quantity <= lowStockAt — raw SQL needed, use this workaround:
        },
      }),
      prisma.expense.aggregate({
        where: { ...branchWhere },
        _sum: { amount: true },
      }),
      prisma.customer.count({ where: { ...branchWhere, isActive: true } }),
      prisma.order.findMany({
        where: { ...branchWhere },
        include: {
          user: { select: { name: true } },
          payment: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.order.aggregate({
        where: {
          ...branchWhere,
          status: "COMPLETED",
          createdAt: { gte: last30 },
        },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: {
          ...branchWhere,
          status: "COMPLETED",
          createdAt: { gte: last30 },
        },
      }),
      prisma.order.aggregate({
        where: {
          ...branchWhere,
          status: "COMPLETED",
          createdAt: { gte: last7 },
        },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: {
          ...branchWhere,
          status: "COMPLETED",
          createdAt: { gte: last7 },
        },
      }),
    ]);

    return NextResponse.json({
      totalRevenue: totalRevenue._sum.total ?? 0,
      totalOrders,
      pendingOrders,
      totalProducts,
      lowStockCount,
      totalExpenses: totalExpenses._sum.amount ?? 0,
      totalCustomers,
      recentOrders,
      revenue30: revenue30._sum.total ?? 0,
      orders30,
      revenue7: revenue7._sum.total ?? 0,
      orders7,
    });
  } catch {
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
};
