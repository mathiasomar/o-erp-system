import { NextResponse } from "next/server";
import { resolveBranchContext } from "@/lib/branch-context";
import prisma from "@/lib/prisma";
import {
  startOfDay,
  endOfDay,
  startOfYesterday,
  endOfYesterday,
  format,
  eachHourOfInterval,
} from "date-fns";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const ctx = await resolveBranchContext();
    if (!ctx) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const bw = { branchId: ctx.branchId };
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const yestStart = startOfYesterday();
    const yestEnd = endOfYesterday();

    const [
      todayOrders,
      todayExpenses,
      yesterdayOrders,
      yesterdayExpenses,
      todayOrderItems,
      pendingOrders,
      todaySplitPayments,
    ] = await Promise.all([
      // Today's completed orders
      prisma.order.findMany({
        where: {
          ...bw,
          status: "COMPLETED",
          createdAt: { gte: todayStart, lte: todayEnd },
        },
        include: {
          payment: true,
          user: { select: { name: true } },
        },
      }),

      // Today's expenses
      prisma.expense.findMany({
        where: {
          ...bw,
          date: { gte: todayStart, lte: todayEnd },
        },
        include: { category: true },
      }),

      // Yesterday's completed orders (for comparison)
      prisma.order.findMany({
        where: {
          ...bw,
          status: "COMPLETED",
          createdAt: { gte: yestStart, lte: yestEnd },
        },
        select: { total: true },
      }),

      // Yesterday's expenses
      prisma.expense.findMany({
        where: {
          ...bw,
          date: { gte: yestStart, lte: yestEnd },
        },
        select: { amount: true },
      }),

      // Today's sold items
      prisma.orderItem.findMany({
        where: {
          order: {
            ...bw,
            status: "COMPLETED",
            createdAt: { gte: todayStart, lte: todayEnd },
          },
        },
        include: {
          product: { include: { category: true } },
        },
      }),

      // Pending orders today
      prisma.order.count({
        where: {
          ...bw,
          status: "PENDING",
          createdAt: { gte: todayStart },
        },
      }),

      // ← query SplitPayment for method breakdown
      prisma.splitPayment.findMany({
        where: {
          payment: {
            order: {
              ...bw,
              status: "COMPLETED",
              createdAt: { gte: todayStart, lte: todayEnd },
            },
          },
        },
        select: { method: true, amount: true },
      }),
    ]);

    // ── Calculate Cost of Goods Sold (COGS) ──────────────────────────────────
    // Calculate total cost of products sold today
    const totalCostOfGoods = todayOrderItems.reduce((sum, item) => {
      // Use the product's costPrice, fallback to 0 if not available
      const costPrice = item.product?.costPrice ?? 0;
      return sum + costPrice * item.quantity;
    }, 0);

    // ── Revenue KPIs ──────────────────────────────────────────────────────────
    const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
    const yestRevenue = yesterdayOrders.reduce((s, o) => s + o.total, 0);
    const todayExpAmt = todayExpenses.reduce((s, e) => s + e.amount, 0);
    const yestExpAmt = yesterdayExpenses.reduce((s, e) => s + e.amount, 0);

    const revDelta =
      yestRevenue > 0
        ? ((todayRevenue - yestRevenue) / yestRevenue) * 100
        : null;

    const expDelta =
      yestExpAmt > 0 ? ((todayExpAmt - yestExpAmt) / yestExpAmt) * 100 : null;

    // ── Hourly breakdown (orders per hour, today only) ────────────────────────
    const hours = eachHourOfInterval({ start: todayStart, end: new Date() });
    const hourlyMap: Record<string, { orders: number; revenue: number }> = {};
    hours.forEach((h) => {
      hourlyMap[format(h, "HH")] = { orders: 0, revenue: 0 };
    });
    todayOrders.forEach((o) => {
      const h = format(new Date(o.createdAt), "HH");
      if (hourlyMap[h]) {
        hourlyMap[h].orders += 1;
        hourlyMap[h].revenue += o.total;
      }
    });
    const hourlyBreakdown = Object.entries(hourlyMap).map(([hour, data]) => ({
      hour: `${hour}:00`,
      orders: data.orders,
      revenue: data.revenue,
    }));

    // ── Payment method breakdown (from splitPayments) ─────────────────────────
    const methodBreakdown = todaySplitPayments.reduce<
      Record<string, { count: number; amount: number }>
    >(
      (acc, sp) => {
        if (!acc[sp.method]) acc[sp.method] = { count: 0, amount: 0 };
        acc[sp.method].count += 1;
        acc[sp.method].amount += sp.amount;
        return acc;
      },
      {
        CASH: { count: 0, amount: 0 },
        MPESA: { count: 0, amount: 0 },
        CARD: { count: 0, amount: 0 },
      },
    );

    // ── Top products today ────────────────────────────────────────────────────
    const productMap: Record<
      string,
      {
        name: string;
        category: string;
        units: number;
        revenue: number;
      }
    > = {};
    todayOrderItems.forEach((item) => {
      if (!productMap[item.productId]) {
        productMap[item.productId] = {
          name: item.productName,
          category: item.product.category?.name ?? "Uncategorised",
          units: 0,
          revenue: 0,
        };
      }
      productMap[item.productId].units += item.quantity;
      productMap[item.productId].revenue += item.total;
    });
    const topProductsToday = Object.entries(productMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // ── Expense by category today ─────────────────────────────────────────────
    const expenseByCategory: Record<string, number> = {};
    todayExpenses.forEach((e) => {
      const cat = e.category?.name ?? "Uncategorised";
      expenseByCategory[cat] = (expenseByCategory[cat] ?? 0) + e.amount;
    });

    // ── Cashier performance today ─────────────────────────────────────────────
    const cashierMap: Record<
      string,
      { name: string; orders: number; revenue: number }
    > = {};
    todayOrders.forEach((o) => {
      const name = o.user?.name ?? "Unknown";
      if (!cashierMap[name]) cashierMap[name] = { name, orders: 0, revenue: 0 };
      cashierMap[name].orders += 1;
      cashierMap[name].revenue += o.total;
    });
    const cashierPerformanceToday = Object.values(cashierMap).sort(
      (a, b) => b.revenue - a.revenue,
    );

    return NextResponse.json({
      date: format(new Date(), "EEEE, dd MMM yyyy"),
      summary: {
        todayRevenue,
        todayExpenses: todayExpAmt,
        todayProfit: todayRevenue - totalCostOfGoods - todayExpAmt,
        todayOrders: todayOrders.length,
        pendingOrders,
        avgOrderValue:
          todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0,
        unitsSold: todayOrderItems.reduce((s, i) => s + i.quantity, 0),
        // vs yesterday
        yestRevenue,
        yestExpenses: yestExpAmt,
        yestOrders: yesterdayOrders.length,
        revDelta,
        expDelta,
      },
      hourlyBreakdown,
      methodBreakdown,
      topProductsToday,
      expenseByCategory,
      cashierPerformanceToday,
      recentOrders: todayOrders
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 8)
        .map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          total: o.total,
          status: o.status,
          createdAt: o.createdAt,
          cashier: o.user?.name ?? "Unknown",
        })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
};
