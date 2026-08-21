import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ role: string }> },
) => {
  try {
    const { role } = await params;
    const roleUpper = role.toUpperCase();

    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role: roleUpper },
      include: { permission: true },
    });

    const keys = rolePermissions.map((rp) => rp.permission.key);
    return NextResponse.json(keys);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch role permissions" },
      { status: 500 },
    );
  }
};
