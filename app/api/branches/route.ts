import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (role !== "ADMIN") {
      return NextResponse.json({ message: "Admin only" }, { status: 403 });
    }

    const branches = await prisma.branch.findMany({
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      include: {
        _count: {
          select: { users: true, orders: true, products: true },
        },
      },
    });

    return NextResponse.json(branches);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch branches" },
      { status: 500 },
    );
  }
};
