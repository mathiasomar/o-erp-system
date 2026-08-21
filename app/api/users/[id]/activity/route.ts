import { NextRequest, NextResponse } from "next/server";
import {
  subDays,
  subMonths,
  startOfDay,
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
      default:
        start = subDays(now, 29);
        groupBy = "day";
    }

    const [orders, logs, recentActivity] = await Promise.all([
      prisma.order.findMany({
        where: {
          userId: id,
          createdAt: { gte: startOfDay(start) },
          status: "COMPLETED",
        },
        select: { createdAt: true, total: true },
      }),
      prisma.activityLog.findMany({
        where: {
          userId: id,
          createdAt: { gte: startOfDay(start) },
        },
        select: { createdAt: true, action: true },
      }),
      prisma.activityLog.findMany({
        where: { userId: id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const intervals =
      groupBy === "day"
        ? eachDayOfInterval({ start, end: now }).map((d) =>
            format(d, "yyyy-MM-dd"),
          )
        : eachMonthOfInterval({ start, end: now }).map((d) =>
            format(d, "yyyy-MM"),
          );

    const grouped: Record<
      string,
      {
        orders: number;
        revenue: number;
        activities: number;
      }
    > = {};
    intervals.forEach((k) => {
      grouped[k] = { orders: 0, revenue: 0, activities: 0 };
    });

    orders.forEach((o) => {
      const key =
        groupBy === "day"
          ? format(new Date(o.createdAt), "yyyy-MM-dd")
          : format(new Date(o.createdAt), "yyyy-MM");
      if (grouped[key]) {
        grouped[key].orders += 1;
        grouped[key].revenue += o.total;
      }
    });

    logs.forEach((l) => {
      const key =
        groupBy === "day"
          ? format(new Date(l.createdAt), "yyyy-MM-dd")
          : format(new Date(l.createdAt), "yyyy-MM");
      if (grouped[key]) grouped[key].activities += 1;
    });

    const chartData = intervals.map((key) => ({
      date:
        groupBy === "day"
          ? format(new Date(key), "MMM d")
          : format(new Date(key + "-01"), "MMM yyyy"),
      orders: grouped[key].orders,
      revenue: grouped[key].revenue,
      activities: grouped[key].activities,
    }));

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const totalActivities = logs.length;

    return NextResponse.json({
      chartData,
      totalOrders,
      totalRevenue,
      totalActivities,
      recentActivity,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch user activity" },
      { status: 500 },
    );
  }
};
