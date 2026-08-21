import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
};
