import { NextRequest, NextResponse } from "next/server";
import {
  startOfDay,
  endOfDay,
  subDays,
  subMonths,
  format,
  eachDayOfInterval,
  eachMonthOfInterval,
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
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);
    let groupBy: "day" | "month" = "day";

    if (from && to) {
      start = startOfDay(new Date(from));
      end = endOfDay(new Date(to));
      const diffDays =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      groupBy = diffDays > 60 ? "month" : "day";
    } else {
      switch (range) {
        case "7d":
          start = subDays(now, 6);
          groupBy = "day";
          break;
        case "30d":
          start = subDays(now, 29);
          groupBy = "day";
          break;
        case "3m":
          start = subMonths(now, 3);
          groupBy = "month";
          break;
        case "1y":
          start = subMonths(now, 12);
          groupBy = "month";
          break;
        default:
          start = subDays(now, 29);
          groupBy = "day";
      }
    }

    // ── Branch scope applied to every query ───────────────────────────────
    const bw = { branchId: ctx.branchId };

    const [orders, expenses, orderItems, stockLogs, inventoryItems] =
      await Promise.all([
        prisma.order.findMany({
          where: { ...bw, createdAt: { gte: start, lte: end } },
          include: {
            payment: true,
            items: {
              include: {
                product: {
                  select: {
                    costPrice: true,
                  },
                },
              },
            },
            user: { select: { name: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        }),
        prisma.expense.findMany({
          where: { ...bw, date: { gte: start, lte: end } },
          include: { category: true },
          orderBy: { date: "asc" },
        }),
        prisma.orderItem.findMany({
          where: {
            order: {
              ...bw,
              createdAt: { gte: start, lte: end },
              status: "COMPLETED",
            },
          },
          include: {
            product: {
              include: { category: true },
            },
          },
        }),
        prisma.stockLog.findMany({
          where: {
            createdAt: { gte: start, lte: end },
            stock: { branchId: ctx.branchId },
          },
          include: { stock: { include: { product: true } } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.stock.findMany({
          where: { branchId: ctx.branchId },
          include: { product: { include: { category: true } } },
        }),
      ]);

    // ── Revenue, expense & profit trend ─────────────────────────────────────
    const intervals =
      groupBy === "day"
        ? eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"))
        : eachMonthOfInterval({ start, end }).map((d) => format(d, "yyyy-MM"));

    const trendMap: Record<
      string,
      {
        revenue: number;
        expenses: number;
        orders: number;
        costOfGoods: number;
        grossProfit: number;
        netProfit: number;
      }
    > = {};
    intervals.forEach((k) => {
      trendMap[k] = {
        revenue: 0,
        expenses: 0,
        orders: 0,
        costOfGoods: 0,
        grossProfit: 0,
        netProfit: 0,
      };
    });

    // Process orders to calculate revenue and COGS by date
    orders
      .filter((o) => o.status === "COMPLETED")
      .forEach((o) => {
        const key =
          groupBy === "day"
            ? format(new Date(o.createdAt), "yyyy-MM-dd")
            : format(new Date(o.createdAt), "yyyy-MM");
        if (trendMap[key]) {
          trendMap[key].revenue += o.total;
          trendMap[key].orders += 1;

          // Calculate COGS for this order
          const orderCost =
            o.items?.reduce((sum, item) => {
              const costPrice = item.product?.costPrice ?? 0;
              return sum + costPrice * item.quantity;
            }, 0) ?? 0;

          trendMap[key].costOfGoods += orderCost;
        }
      });

    // Process expenses
    expenses.forEach((e) => {
      const key =
        groupBy === "day"
          ? format(new Date(e.date), "yyyy-MM-dd")
          : format(new Date(e.date), "yyyy-MM");
      if (trendMap[key]) trendMap[key].expenses += e.amount;
    });

    // Calculate profit metrics for each interval
    const trendData = intervals.map((key) => {
      const data = trendMap[key];
      const grossProfit = data.revenue - data.costOfGoods;
      const netProfit = data.revenue - data.costOfGoods - data.expenses;

      return {
        date:
          groupBy === "day"
            ? format(new Date(key), "MMM d")
            : format(new Date(key + "-01"), "MMM yyyy"),
        revenue: data.revenue,
        expenses: data.expenses,
        orders: data.orders,
        costOfGoods: data.costOfGoods,
        grossProfit: grossProfit,
        netProfit: netProfit,
        profitMargin:
          data.revenue > 0
            ? Number(((netProfit / data.revenue) * 100).toFixed(1))
            : 0,
        grossMargin:
          data.revenue > 0
            ? Number(((grossProfit / data.revenue) * 100).toFixed(1))
            : 0,
      };
    });

    // ── Sales summary KPIs ──────────────────────────────────────────────────
    const completedOrders = orders.filter((o) => o.status === "COMPLETED");
    const cancelledOrders = orders.filter((o) => o.status === "CANCELLED");
    const totalRevenue = completedOrders.reduce((s, o) => s + o.total, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    // Calculate total COGS
    const totalCostOfGoods = completedOrders.reduce((sum, order) => {
      const orderCost =
        order.items?.reduce((orderSum, item) => {
          const costPrice = item.product?.costPrice ?? 0;
          return orderSum + costPrice * item.quantity;
        }, 0) ?? 0;
      return sum + orderCost;
    }, 0);

    const totalGrossProfit = totalRevenue - totalCostOfGoods;
    const totalNetProfit = totalRevenue - totalCostOfGoods - totalExpenses;
    const avgOrderValue =
      completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    // ── Top products with cost and profit ──────────────────────────────────
    const productMap: Record<
      string,
      {
        name: string;
        category: string;
        units: number;
        revenue: number;
        cost: number;
        profit: number;
        margin: number;
      }
    > = {};
    orderItems.forEach((item) => {
      const id = item.productId;
      const costPrice = item.product?.costPrice ?? 0;
      const itemCost = costPrice * item.quantity;
      const itemProfit = item.total - itemCost;

      if (!productMap[id]) {
        productMap[id] = {
          name: item.productName,
          category: item.product.category?.name ?? "Uncategorised",
          units: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          margin: 0,
        };
      }
      productMap[id].units += item.quantity;
      productMap[id].revenue += item.total;
      productMap[id].cost += itemCost;
      productMap[id].profit += itemProfit;
    });

    // Calculate margin for each product
    Object.values(productMap).forEach((product) => {
      product.margin =
        product.revenue > 0
          ? Number(((product.profit / product.revenue) * 100).toFixed(1))
          : 0;
    });

    const topProducts = Object.entries(productMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // ── Payment breakdown ───────────────────────────────────────────────────
    const splitPaymentsInRange = await prisma.splitPayment.findMany({
      where: {
        payment: {
          order: {
            branchId: ctx.branchId,
            status: "COMPLETED",
            createdAt: { gte: start, lte: end },
          },
        },
      },
      select: { method: true, amount: true },
    });

    const paymentBreakdown = splitPaymentsInRange.reduce<
      Record<string, { count: number; amount: number }>
    >((acc, sp) => {
      if (!acc[sp.method]) acc[sp.method] = { count: 0, amount: 0 };
      acc[sp.method].count += 1;
      acc[sp.method].amount += sp.amount;
      return acc;
    }, {});

    // ── Expense breakdown by category ───────────────────────────────────────
    const expenseByCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category?.name ?? "Uncategorised";
      expenseByCategory[cat] = (expenseByCategory[cat] ?? 0) + e.amount;
    });

    // ── Inventory summary ───────────────────────────────────────────────────
    const outOfStock = inventoryItems.filter((i) => i.quantity === 0).length;
    const lowStock = inventoryItems.filter(
      (i) => i.quantity > 0 && i.quantity <= i.lowStockAt,
    ).length;
    const totalStock = inventoryItems.reduce((s, i) => s + i.quantity, 0);
    const stockValue = inventoryItems.reduce(
      (s, i) => s + i.quantity * (i.product.price ?? 0),
      0,
    );

    // ── Stock movement ──────────────────────────────────────────────────────
    const stockMovement = stockLogs.slice(0, 50).map((log) => ({
      product: log.stock.product.name,
      reason: log.reason,
      change: log.change,
      before: log.quantityBefore,
      after: log.quantityAfter,
      note: log.note,
      date: format(new Date(log.createdAt), "dd MMM yyyy HH:mm"),
    }));

    // ── Cashier performance with profit ────────────────────────────────────
    // Create a map of orderId to cost
    const orderCostMap: Record<string, number> = {};
    orderItems.forEach((item) => {
      const orderId = item.orderId;
      const costPrice = item.product?.costPrice ?? 0;
      orderCostMap[orderId] =
        (orderCostMap[orderId] || 0) + costPrice * item.quantity;
    });

    const cashierMap: Record<
      string,
      {
        name: string;
        orders: number;
        revenue: number;
        cost: number;
        profit: number;
        margin: number;
      }
    > = {};

    completedOrders.forEach((o) => {
      const name = o.user?.name ?? "Unknown";
      const orderCost = orderCostMap[o.id] || 0;
      const orderProfit = o.total - orderCost;

      if (!cashierMap[name]) {
        cashierMap[name] = {
          name,
          orders: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          margin: 0,
        };
      }
      cashierMap[name].orders += 1;
      cashierMap[name].revenue += o.total;
      cashierMap[name].cost += orderCost;
      cashierMap[name].profit += orderProfit;
    });

    // Calculate margin for each cashier
    Object.values(cashierMap).forEach((cashier) => {
      cashier.margin =
        cashier.revenue > 0
          ? Number(((cashier.profit / cashier.revenue) * 100).toFixed(1))
          : 0;
    });

    const cashierPerformance = Object.values(cashierMap).sort(
      (a, b) => b.revenue - a.revenue,
    );

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalExpenses,
        totalCostOfGoods,
        totalGrossProfit,
        totalNetProfit,
        totalOrders: completedOrders.length,
        cancelledOrders: cancelledOrders.length,
        avgOrderValue,
        outOfStock,
        lowStock,
        totalStock,
        stockValue,
        overallMargin:
          totalRevenue > 0
            ? Number(((totalNetProfit / totalRevenue) * 100).toFixed(1))
            : 0,
        grossMargin:
          totalRevenue > 0
            ? Number(((totalGrossProfit / totalRevenue) * 100).toFixed(1))
            : 0,
      },
      trendData,
      topProducts,
      paymentBreakdown,
      expenseByCategory,
      stockMovement,
      cashierPerformance,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to fetch reports" },
      { status: 500 },
    );
  }
};
