import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export const POST = async () => {
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

    await prisma.notification.updateMany({
      where: {
        OR: [{ userId }, { userId: null, roles: { has: role } }],
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
};
