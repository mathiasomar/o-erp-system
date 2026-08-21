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

    const logs = await prisma.stockLog.findMany({
      where: {
        ...(from || to
          ? {
              createdAt: {
                ...(from && { gte: startOfDay(new Date(from)) }),
                ...(to && { lte: endOfDay(new Date(to)) }),
              },
            }
          : {}),
      },
      include: {
        stock: {
          include: {
            product: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(logs);
  } catch {
    return NextResponse.json(
      { message: "Failed to export stock logs" },
      { status: 500 },
    );
  }
};
