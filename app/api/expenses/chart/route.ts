import { NextRequest, NextResponse } from "next/server";
import {
  format,
  eachDayOfInterval,
  eachMonthOfInterval,
  subDays,
  subMonths,
  startOfDay,
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

    const expenses = await prisma.expense.findMany({
      where: { ...branchWhere, date: { gte: startOfDay(start) } },
      include: { category: true },
      orderBy: { date: "asc" },
    });

    const intervals =
      groupBy === "day"
        ? eachDayOfInterval({ start, end: now }).map((d) =>
            format(d, "yyyy-MM-dd"),
          )
        : eachMonthOfInterval({ start, end: now }).map((d) =>
            format(d, "yyyy-MM"),
          );

    const grouped: Record<string, number> = {};
    intervals.forEach((k) => {
      grouped[k] = 0;
    });

    expenses.forEach((e) => {
      const key =
        groupBy === "day"
          ? format(new Date(e.date), "yyyy-MM-dd")
          : format(new Date(e.date), "yyyy-MM");
      if (key in grouped) grouped[key] += e.amount;
    });

    const chartData = intervals.map((key) => ({
      date:
        groupBy === "day"
          ? format(new Date(key), "MMM d")
          : format(new Date(key + "-01"), "MMM yyyy"),
      amount: grouped[key],
    }));

    return NextResponse.json({ chartData });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch chart data" },
      { status: 500 },
    );
  }
}
