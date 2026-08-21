import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ group: "asc" }, { label: "asc" }],
      include: {
        rolePermissions: {
          select: { role: true },
        },
      },
    });
    return NextResponse.json(permissions);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch permissions" },
      { status: 500 },
    );
  }
};
