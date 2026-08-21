import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const role = (session.user as { role?: string }).role ?? "CASHIER";

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "30", 10);
    const onlyUnread = searchParams.get("unread") === "true";

    const where = {
      AND: [
        {
          OR: [{ userId }, { userId: null, roles: { has: role } }],
        },
        ...(onlyUnread ? [{ read: false }] : []),
      ],
    };

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: {
          AND: [
            {
              OR: [{ userId }, { userId: null, roles: { has: role } }],
            },
            { read: false },
          ],
        },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
};
