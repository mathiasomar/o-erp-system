import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { startOfDay, endOfDay } from "date-fns";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    const expenses = await prisma.expense.findMany({
      where: {
        ...(from || to
          ? {
              date: {
                ...(from && { gte: startOfDay(new Date(from)) }),
                ...(to && { lte: endOfDay(new Date(to)) }),
              },
            }
          : {}),
      },
      include: {
        category: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
  } catch {
    return NextResponse.json(
      { message: "Failed to export expenses" },
      { status: 500 },
    );
  }
};
