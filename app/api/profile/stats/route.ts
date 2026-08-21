import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { subDays, startOfDay } from "date-fns";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const now = new Date();
    const last30 = startOfDay(subDays(now, 29));

    const [
      totalOrders,
      totalRevenue,
      last30Orders,
      totalExpenses,
      recentActivity,
    ] = await Promise.all([
      prisma.order.count({
        where: { userId, status: "COMPLETED" },
      }),
      prisma.order.aggregate({
        where: { userId, status: "COMPLETED" },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: {
          userId,
          status: "COMPLETED",
          createdAt: { gte: last30 },
        },
      }),
      prisma.expense.count({ where: { userId } }),
      prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
    ]);

    return NextResponse.json({
      totalOrders,
      totalRevenue: totalRevenue._sum.total ?? 0,
      last30Orders,
      totalExpenses,
      recentActivity,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch stats" },
      { status: 500 },
    );
  }
};
