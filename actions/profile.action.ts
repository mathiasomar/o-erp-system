"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";
import { ActivityAction } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

// ── schemas ───────────────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  username: z.string().regex(/^[a-z][a-z0-9_]{2,19}$/, "Invalid username"),
  image: z.string().url("Invalid URL").optional().or(z.literal("")),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

// ── get current user ──────────────────────────────────────────────────────────

export const getCurrentUser = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      image: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          orders: true,
          expenses: true,
          activityLogs: true,
        },
      },
    },
  });

  return user;
};

// ── update profile ────────────────────────────────────────────────────────────

export const updateProfile = async (values: UpdateProfileValues) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = updateProfileSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  // Check email not taken by another user
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: parsed.data.email }, { username: parsed.data.username }],
      NOT: { id: session.user.id },
    },
  });
  if (existing) {
    return {
      success: false,
      error: { email: ["Email or Username already in use"] },
    };
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      username: parsed.data.username,
      image: parsed.data.image || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
    },
  });

  await logActivity({
    action: ActivityAction.USER_UPDATED,
    entity: "User",
    entityId: updated.id,
    entityLabel: updated.name,
    userId: updated.id,
    meta: { field: "profile", email: updated.email },
  });

  revalidatePath("/dashboard/profile");
  return { success: true, user: updated };
};

// ── change password ───────────────────────────────────────────────────────────

export const changePassword = async (values: ChangePasswordValues) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = changePasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });

    await logActivity({
      action: ActivityAction.USER_UPDATED,
      entity: "User",
      entityId: session.user.id,
      entityLabel: session.user.name ?? "Unknown",
      userId: session.user.id,
      meta: { field: "password" },
    });

    return { success: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to change password";
    return { success: false, error: message };
  }
};
