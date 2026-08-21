import { NextRequest, NextResponse } from "next/server";
import {
  subDays,
  subMonths,
  startOfDay,
  endOfDay,
  getHours,
  getDay,
} from "date-fns";
import prisma from "@/lib/prisma";
import { resolveBranchContext } from "@/lib/branch-context";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    const ctx = await resolveBranchContext();
    if (!ctx) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") ?? "30d";
    const now = new Date();
    let start: Date;

    switch (range) {
      case "7d":
        start = subDays(now, 6);
        break;
      case "30d":
        start = subDays(now, 29);
        break;
      case "3m":
        start = subMonths(now, 3);
        break;
      case "1y":
        start = subMonths(now, 12);
        break;
      default:
        start = subDays(now, 29);
    }

    // ── Branch scope ──────────────────────────────────────────────────────
    const bw = { branchId: ctx.branchId };

    const [orders, expenses, orderItems] = await Promise.all([
      prisma.order.findMany({
        where: {
          ...bw,
          status: "COMPLETED",
          createdAt: { gte: startOfDay(start), lte: endOfDay(now) },
        },
        include: {
          items: true,
          payment: true,
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.expense.findMany({
        where: { ...bw, date: { gte: startOfDay(start) } },
        include: { category: true },
      }),
      prisma.orderItem.findMany({
        where: {
          order: {
            ...bw,
            status: "COMPLETED",
            createdAt: { gte: startOfDay(start) },
          },
        },
        include: { product: { include: { category: true } } },
      }),
    ]);

    // ── Hourly heatmap ──────────────────────────────────────────────────────
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: `${hour.toString().padStart(2, "0")}:00`,
      orders: 0,
      revenue: 0,
    }));
    orders.forEach((o) => {
      const hour = getHours(new Date(o.createdAt));
      hourlyData[hour].orders += 1;
      hourlyData[hour].revenue += o.total;
    });

    // ── Day of week breakdown ────────────────────────────────────────────────
    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayData = Array.from({ length: 7 }, (_, i) => ({
      day: DAY_NAMES[i],
      orders: 0,
      revenue: 0,
    }));
    orders.forEach((o) => {
      const day = getDay(new Date(o.createdAt));
      dayData[day].orders += 1;
      dayData[day].revenue += o.total;
    });

    // ── Category revenue breakdown ───────────────────────────────────────────
    const catRevMap: Record<string, { revenue: number; units: number }> = {};
    orderItems.forEach((item) => {
      const cat = item.product.category?.name ?? "Uncategorised";
      if (!catRevMap[cat]) catRevMap[cat] = { revenue: 0, units: 0 };
      catRevMap[cat].revenue += item.total;
      catRevMap[cat].units += item.quantity;
    });
    const categoryBreakdown = Object.entries(catRevMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    // ── KPIs ─────────────────────────────────────────────────────────────────
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const grossMargin =
      totalRevenue > 0
        ? ((totalRevenue - totalExpenses) / totalRevenue) * 100
        : 0;

    // ── Cashier leaderboard ──────────────────────────────────────────────────
    const cashierMap: Record<
      string,
      { name: string; orders: number; revenue: number; avgOrder: number }
    > = {};
    orders.forEach((o) => {
      const name = o.user?.name ?? "Unknown";
      if (!cashierMap[name]) {
        cashierMap[name] = { name, orders: 0, revenue: 0, avgOrder: 0 };
      }
      cashierMap[name].orders += 1;
      cashierMap[name].revenue += o.total;
    });
    const cashierLeaderboard = Object.values(cashierMap)
      .map((c) => ({
        ...c,
        avgOrder: c.orders > 0 ? c.revenue / c.orders : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // ── Payment method trend ─────────────────────────────────────────────────
    // Fetch split payments for the range
    const splitPaymentsForAnalytics = await prisma.splitPayment.findMany({
      where: {
        payment: {
          order: {
            branchId: ctx.branchId,
            status: "COMPLETED",
            createdAt: { gte: startOfDay(start), lte: endOfDay(now) },
          },
        },
      },
      select: { method: true },
    });

    const methodTrend = splitPaymentsForAnalytics.reduce<
      Record<string, number>
    >(
      (acc, sp) => {
        acc[sp.method] = (acc[sp.method] ?? 0) + 1;
        return acc;
      },
      { CASH: 0, MPESA: 0, CARD: 0 },
    );

    // ── Order size distribution ──────────────────────────────────────────────
    const buckets = [
      { label: "0–500", min: 0, max: 500 },
      { label: "501–1000", min: 501, max: 1000 },
      { label: "1001–5000", min: 1001, max: 5000 },
      { label: "5001–10000", min: 5001, max: 10000 },
      { label: "10000+", min: 10001, max: Infinity },
    ];
    const orderDistribution = buckets.map((b) => ({
      label: b.label,
      count: orders.filter((o) => o.total >= b.min && o.total <= b.max).length,
    }));

    return NextResponse.json({
      kpis: {
        totalRevenue,
        totalExpenses,
        grossMargin: parseFloat(grossMargin.toFixed(1)),
        totalOrders: orders.length,
        avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      },
      hourlyData,
      dayData,
      categoryBreakdown,
      cashierLeaderboard,
      methodTrend,
      orderDistribution,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
};
