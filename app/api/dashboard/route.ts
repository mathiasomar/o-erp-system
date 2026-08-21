import { NextRequest, NextResponse } from "next/server";
import {
  subDays,
  startOfDay,
  subMonths,
  eachDayOfInterval,
  format,
} from "date-fns";
import prisma from "@/lib/prisma";
import { resolveBranchContext } from "@/lib/branch-context";

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveBranchContext();
    if (!ctx)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const branchWhere = { branchId: ctx.branchId };
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") ?? "7d";

    const now = new Date();
    const start =
      range === "30d"
        ? subDays(now, 29)
        : range === "3m"
          ? subMonths(now, 3)
          : subDays(now, 6);

    // ── KPI counts ──────────────────────────────────────────────────────
    const [
      totalOrders,
      completedOrders,
      totalProducts,
      totalCategories,
      lowStockItems,
      outOfStockItems,
      totalExpenses,
    ] = await Promise.all([
      prisma.order.count({ where: { ...branchWhere } }),
      prisma.order.count({ where: { ...branchWhere, status: "COMPLETED" } }),
      prisma.product.count({ where: { ...branchWhere, isActive: true } }),
      prisma.category.count({ where: { ...branchWhere } }),
      prisma.stock.count({
        where: { ...branchWhere, quantity: { gt: 0 } },
      }),
      prisma.stock.count({ where: { ...branchWhere, quantity: 0 } }),
      prisma.expense.aggregate({
        where: { ...branchWhere },
        _sum: { amount: true },
      }),
    ]);

    // ── Revenue in range ────────────────────────────────────────────────
    const revenueOrders = await prisma.order.findMany({
      where: {
        ...branchWhere,
        status: "COMPLETED",
        createdAt: { gte: startOfDay(start) },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                costPrice: true,
              },
            },
          },
        },
      },
    });
    // ── Calculate Cost of Goods Sold (COGS) ──────────────────────────────────
    // Calculate total cost of products sold today
    const totalCostOfGoods = revenueOrders.reduce((sum, order) => {
      const orderCost = order.items.reduce((orderSum, item) => {
        // Use the product's costPrice, fallback to 0 if not available
        const costPrice = item.product?.costPrice ?? 0;
        return orderSum + costPrice * item.quantity;
      }, 0);
      return sum + orderCost;
    }, 0);

    const totalRevenue = revenueOrders.reduce((s, o) => s + o.total, 0);

    // ── Expenses in range ───────────────────────────────────────────────
    const expensesInRange = await prisma.expense.findMany({
      where: { ...branchWhere, date: { gte: startOfDay(start) } },
      select: { amount: true, date: true },
    });
    const totalExpensesInRange = expensesInRange.reduce(
      (s, e) => s + e.amount,
      0,
    );

    // // ── Revenue vs expenses chart (daily) ───────────────────────────────
    // const days = eachDayOfInterval({ start, end: now });
    // const chartData = days.map((day) => {
    //   const key = format(day, "yyyy-MM-dd");
    //   const rev = revenueOrders
    //     .filter((o) => format(new Date(o.createdAt), "yyyy-MM-dd") === key)
    //     .reduce((s, o) => s + o.total, 0);
    //   const exp = expensesInRange
    //     .filter((e) => format(new Date(e.date), "yyyy-MM-dd") === key)
    //     .reduce((s, e) => s + e.amount, 0);
    //   return { date: format(day, "MMM d"), revenue: rev, expenses: exp };
    // });

    // ── Revenue vs expenses chart (daily) ───────────────────────────────
    const days = eachDayOfInterval({ start, end: now });
    const chartData = days.map((day) => {
      const key = format(day, "yyyy-MM-dd");

      const dayOrders = revenueOrders.filter(
        (o) => format(new Date(o.createdAt), "yyyy-MM-dd") === key,
      );

      const rev = dayOrders.reduce((s, o) => s + o.total, 0);
      const exp = expensesInRange
        .filter((e) => format(new Date(e.date), "yyyy-MM-dd") === key)
        .reduce((s, e) => s + e.amount, 0);

      // Calculate COGS
      const costOfGoods = dayOrders.reduce((sum, order) => {
        const orderCost =
          order.items?.reduce((orderSum, item) => {
            const costPrice = item.product?.costPrice ?? 0;
            return orderSum + costPrice * item.quantity;
          }, 0) ?? 0;
        return sum + orderCost;
      }, 0);

      const grossProfit = rev - costOfGoods;
      const netProfit = rev - costOfGoods - exp;

      return {
        date: format(day, "MMM d"),
        revenue: rev,
        expenses: exp,
        costOfGoods: costOfGoods,
        grossProfit: grossProfit,
        netProfit: netProfit,
        // For charting libraries that prefer separate series
        profitLoss: netProfit, // Positive = profit, Negative = loss
        margin: rev > 0 ? (netProfit / rev) * 100 : 0,
        // For stacked charts
        costs: costOfGoods + exp, // Total costs (COGS + Expenses)
      };
    });

    // ── Recent orders ────────────────────────────────────────────────────
    const recentOrders = await prisma.order.findMany({
      where: { ...branchWhere },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        items: { select: { quantity: true } },
        payment: {
          include: {
            splitPayments: {
              select: { method: true, amount: true },
              orderBy: { amount: "desc" },
            },
          },
        },
      },
    });

    // ── Top products by units sold ───────────────────────────────────────
    const topProducts = await prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
      where: {
        order: {
          ...branchWhere,
          status: "COMPLETED",
          createdAt: { gte: startOfDay(start) },
        },
      },
    });

    // ── Payment method breakdown ──────────────────────────────────────────────
    // method is now on SplitPayment — group by that instead
    const splitPayments = await prisma.splitPayment.findMany({
      where: {
        payment: {
          order: {
            ...branchWhere,
            status: "COMPLETED",
            createdAt: { gte: startOfDay(start) },
          },
        },
      },
      select: { method: true, amount: true },
    });

    // ── Payment method breakdown ─────────────────────────────────────────
    // const paymentBreakdown = await prisma.payment.groupBy({
    //   by: ["method"],
    //   _sum: { amount: true },
    //   _count: { id: true },
    //   where: {
    //     order: {
    //       ...branchWhere,
    //       status: "COMPLETED",
    //       createdAt: { gte: startOfDay(start) },
    //     },
    //   },
    // });

    // Aggregate in JS
    const paymentBreakdown = splitPayments.reduce<
      Record<string, { count: number; amount: number }>
    >((acc, sp) => {
      if (!acc[sp.method]) acc[sp.method] = { count: 0, amount: 0 };
      acc[sp.method].count += 1;
      acc[sp.method].amount += sp.amount;
      return acc;
    }, {});

    // ── M-Pesa stats ─────────────────────────────────────────────────────
    const mpesaStats = await prisma.mpesaTransaction.groupBy({
      by: ["status"],
      where: { ...branchWhere, createdAt: { gte: startOfDay(start) } },
      _count: { id: true },
      _sum: { amount: true },
    });

    return NextResponse.json({
      kpis: {
        totalRevenue,
        totalExpensesInRange,
        netProfit: totalRevenue - totalCostOfGoods - totalExpensesInRange,
        totalOrders,
        completedOrders,
        totalProducts,
        totalCategories,
        lowStockItems,
        outOfStockItems,
        totalExpensesAllTime: totalExpenses._sum.amount ?? 0,
      },
      chartData,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt,
        items: o.items,
        primaryMethod: o.payment?.splitPayments?.[0]?.method ?? null, // ← new
        splitPayments: o.payment?.splitPayments ?? [], // ← new
      })),
      topProducts,
      paymentBreakdown,
      mpesaStats,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to fetch dashboard" },
      { status: 500 },
    );
  }
}
