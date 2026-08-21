import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: [{ group: "asc" }, { label: "asc" }],
    });
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch settings" },
      { status: 500 },
    );
  }
};

/**
 * PUT endpoint to update multiple settings at once.
 * Automatically invalidates metadata cache so generateMetadata picks up new values.
 * Used by admin settings UI when changes are saved.
 */
const updateSchema = z.record(z.string(), z.string());

export const PUT = async (request: Request) => {
  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid settings data", errors: parsed.error.issues },
        { status: 400 },
      );
    }

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const keys = Object.keys(parsed.data);

    // Fetch existing settings to avoid throwing on missing keys
    const existing = await prisma.systemSetting.findMany({
      where: { key: { in: keys } },
      select: { key: true },
    });
    const existingKeys = new Set(existing.map((s) => s.key));

    // Update only settings that exist in the database
    const ops = Object.entries(parsed.data)
      .filter(([k]) => existingKeys.has(k))
      .map(([key, value]) =>
        prisma.systemSetting.update({
          where: { key },
          data: { value, updatedBy: userId, updatedAt: new Date() },
        }),
      );

    if (ops.length > 0) {
      await prisma.$transaction(ops);
    }

    // Revalidate paths that depend on settings metadata
    revalidatePath("/", "layout"); // Root layout
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");

    return NextResponse.json({
      success: true,
      updated: ops.length,
    });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { message: "Failed to update settings" },
      { status: 500 },
    );
  }
};
