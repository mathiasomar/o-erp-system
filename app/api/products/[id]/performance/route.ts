import { NextRequest, NextResponse } from "next/server";
import {
  startOfDay,
  subDays,
  subMonths,
  eachDayOfInterval,
  eachMonthOfInterval,
  format,
} from "date-fns";
import prisma from "@/lib/prisma";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") ?? "30d";

    const now = new Date();
    let start: Date;
    let groupBy: "day" | "month";

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

    const orderItems = await prisma.orderItem.findMany({
      where: {
        productId: id,
        order: {
          createdAt: { gte: startOfDay(start) },
          status: "COMPLETED",
        },
      },
      include: {
        order: { select: { createdAt: true, id: true } },
      },
    });

    // Build full date series so zeros show
    const intervals =
      groupBy === "day"
        ? eachDayOfInterval({ start, end: now }).map((d) =>
            format(d, "yyyy-MM-dd"),
          )
        : eachMonthOfInterval({ start, end: now }).map((d) =>
            format(d, "yyyy-MM"),
          );

    const grouped: Record<string, { revenue: number; units: number }> = {};
    intervals.forEach((k) => {
      grouped[k] = { revenue: 0, units: 0 };
    });

    orderItems.forEach((item) => {
      const key =
        groupBy === "day"
          ? format(new Date(item.order.createdAt), "yyyy-MM-dd")
          : format(new Date(item.order.createdAt), "yyyy-MM");
      if (grouped[key]) {
        grouped[key].revenue += item.unitPrice * item.quantity;
        grouped[key].units += item.quantity;
      }
    });

    const chartData = intervals.map((key) => ({
      date:
        groupBy === "day"
          ? format(new Date(key), "MMM d")
          : format(new Date(key + "-01"), "MMM yyyy"),
      revenue: grouped[key].revenue,
      units: grouped[key].units,
    }));

    const totalRevenue = orderItems.reduce(
      (s, i) => s + i.unitPrice * i.quantity,
      0,
    );
    const totalUnits = orderItems.reduce((s, i) => s + i.quantity, 0);
    const totalOrders = new Set(orderItems.map((i) => i.order.id)).size;

    return NextResponse.json({
      chartData,
      totalRevenue,
      totalUnits,
      totalOrders,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch performance" },
      { status: 500 },
    );
  }
};
