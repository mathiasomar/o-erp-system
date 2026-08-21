import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { resolveBranchContext } from "@/lib/branch-context";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    const ctx = await resolveBranchContext();
    if (!ctx) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const action = searchParams.get("action") ?? undefined;
    const entity = searchParams.get("entity") ?? undefined;
    const userId = searchParams.get("userId") ?? undefined;
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);

    const where = {
      // ── Branch scope ───────────────────────────────────────────────────────
      branchId: ctx.branchId,
      ...(action && { action: action as never }),
      ...(entity && { entity }),
      ...(userId && { userId }),
      ...(search && {
        OR: [
          { entityLabel: { contains: search, mode: "insensitive" as const } },
          { entity: { contains: search, mode: "insensitive" as const } },
          {
            user: { name: { contains: search, mode: "insensitive" as const } },
          },
        ],
      }),
      ...(from || to
        ? {
            createdAt: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total, page, limit });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch activity" },
      { status: 500 },
    );
  }
};
