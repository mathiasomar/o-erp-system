import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // ← never cache this route

export const GET = async () => {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { isSecret: false },
      orderBy: [{ group: "asc" }],
    });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return NextResponse.json(map, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch settings" },
      { status: 500 },
    );
  }
};
