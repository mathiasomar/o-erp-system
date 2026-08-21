"use server";

import { revalidatePath } from "next/cache";
// import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { ActivityAction } from "@/generated/prisma/enums";

// ── Get all settings ──────────────────────────────────────────────────────────

export const getAllSettings = async () => {
  const settings = await prisma.systemSetting.findMany({
    orderBy: [{ group: "asc" }, { label: "asc" }],
  });
  return settings;
};

// ── Get settings as a flat map ────────────────────────────────────────────────

export const getSettingsMap = async (): Promise<Record<string, string>> => {
  const settings = await prisma.systemSetting.findMany();
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
};

// ── Get a single setting with .env fallback ───────────────────────────────────

const ENV_FALLBACKS: Record<string, string> = {
  mpesa_consumer_key: process.env.MPESA_CONSUMER_KEY ?? "",
  mpesa_consumer_secret: process.env.MPESA_CONSUMER_SECRET ?? "",
  mpesa_shortcode: process.env.MPESA_SHORTCODE ?? "",
  mpesa_passkey: process.env.MPESA_PASSKEY ?? "",
  mpesa_callback_url: process.env.MPESA_CALLBACK_URL ?? "",
  mpesa_env: process.env.MPESA_ENV ?? "sandbox",
  cloudinary_cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "",
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET ?? "",
  cloudinary_upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET ?? "",
};

export const getSetting = async (key: string): Promise<string> => {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  // DB value takes priority; fall back to .env; then empty string
  if (setting?.value) return setting.value;
  return ENV_FALLBACKS[key] ?? "";
};

// ── Update a group of settings ────────────────────────────────────────────────

const updateSchema = z.record(z.string(), z.string());

export const updateSettings = async (updates: Record<string, string>) => {
  const parsed = updateSchema.safeParse(updates);
  if (!parsed.success) {
    return { success: false, error: "Invalid settings data" };
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? null;

  // Fetch existing setting keys to avoid throwing on missing keys,
  // then perform per-key `update` inside a single transaction to
  // reduce round-trips compared to many separate `updateMany` calls.
  const keys = Object.keys(parsed.data);
  const existing = await prisma.systemSetting.findMany({
    where: { key: { in: keys } },
    select: { key: true },
  });
  const existingKeys = new Set(existing.map((s) => s.key));

  const ops = Object.entries(parsed.data)
    .filter(([k]) => existingKeys.has(k))
    .map(([key, value]) =>
      prisma.systemSetting.update({
        where: { key },
        data: { value, updatedBy: userId },
      }),
    );

  if (ops.length > 0) {
    await prisma.$transaction(ops);
  }

  await logActivity({
    action: ActivityAction.SETTINGS_UPDATED,
    entity: "Settings",
    entityLabel: `${Object.keys(updates).length} setting(s)`,
    meta: { keys: Object.keys(parsed.data).join(",") },
  });

  // Revalidate root layout to regenerate metadata from updated settings
  // revalidatePath("/", "layout");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true };
};

// ── Reset a single setting to default ────────────────────────────────────────

export const resetSetting = async (key: string) => {
  await prisma.systemSetting.update({
    where: { key },
    data: { value: "" },
  });
  // Revalidate root layout to regenerate metadata
  revalidatePath("/", "layout");
  revalidatePath("/dashboard/settings");
  return { success: true };
};
