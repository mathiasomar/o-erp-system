import { resolveBranchContext } from "@/lib/branch-context";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const ctx = await resolveBranchContext();
    if (!ctx)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const users = await prisma.user.findMany({
      where: { branchId: ctx.branchId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            expenses: true,
          },
        },
      },
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 },
    );
  }
};
