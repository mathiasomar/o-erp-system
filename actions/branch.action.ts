"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { ActivityAction } from "@/generated/prisma/enums";
import { BRANCH_COOKIE } from "@/lib/branch-context";

// ── Assert caller is admin ────────────────────────────────────────────────────

const assertAdmin = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") throw new Error("Admin only");
  return session!.user;
};

// ── Switch active branch (sets cookie) ───────────────────────────────────────

export const switchBranch = async (branchId: string) => {
  await assertAdmin();

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
  });
  if (!branch || !branch.isActive) {
    return { success: false, error: "Branch not found or inactive" };
  }

  const cookieStore = await cookies();
  cookieStore.set(BRANCH_COOKIE, branchId, {
    httpOnly: false, // readable by client for UI purposes
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  revalidatePath("/dashboard", "layout");
  return { success: true, branch };
};

// ── Create branch ─────────────────────────────────────────────────────────────

const branchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(2).max(20, "Max 20 chars").toUpperCase(),
  address: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
});

export type BranchFormValues = z.infer<typeof branchSchema>;

export const createBranch = async (values: BranchFormValues) => {
  const caller = await assertAdmin();
  const parsed = branchSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const exists = await prisma.branch.findUnique({
    where: { code: parsed.data.code },
  });
  if (exists) {
    return { success: false, error: { code: ["Branch code already in use"] } };
  }

  const branch = await prisma.branch.create({
    data: {
      name: parsed.data.name,
      code: parsed.data.code,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
    },
  });

  await logActivity({
    action: ActivityAction.BRANCH_CREATED,
    entity: "Branch",
    entityId: branch.id,
    entityLabel: branch.name,
    userId: caller.id,
  });

  revalidatePath("/dashboard/branches");
  return { success: true, branch };
};

// ── Update branch ─────────────────────────────────────────────────────────────

export const updateBranch = async (
  id: string,
  values: BranchFormValues & { isActive?: boolean },
) => {
  const caller = await assertAdmin();
  const parsed = branchSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const branch = await prisma.branch.update({
    where: { id },
    data: {
      name: parsed.data.name,
      code: parsed.data.code,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      isActive: values.isActive ?? true,
    },
  });

  await logActivity({
    action: ActivityAction.BRANCH_UPDATED,
    entity: "Branch",
    entityId: branch.id,
    entityLabel: branch.name,
    userId: caller.id,
  });

  revalidatePath("/dashboard/branches");
  revalidatePath(`/dashboard/branches/${id}`);
  return { success: true, branch };
};

// ── Set default branch ────────────────────────────────────────────────────────

export const setDefaultBranch = async (id: string) => {
  await assertAdmin();

  await prisma.$transaction([
    prisma.branch.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    }),
    prisma.branch.update({
      where: { id },
      data: { isDefault: true },
    }),
  ]);

  revalidatePath("/dashboard/branches");
  return { success: true };
};

// ── Assign user to branch ─────────────────────────────────────────────────────

export const assignUserToBranch = async (userId: string, branchId: string) => {
  const caller = await assertAdmin();

  const [user, branch] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.branch.findUnique({ where: { id: branchId } }),
  ]);

  if (!user) return { success: false, error: "User not found" };
  if (!branch) return { success: false, error: "Branch not found" };
  if (user.role === "ADMIN") {
    return { success: false, error: "Admins cannot be assigned to a branch" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { branchId },
  });

  await logActivity({
    action: ActivityAction.BRANCH_USER_ASSIGNED,
    entity: "User",
    entityId: userId,
    entityLabel: user.name,
    userId: caller.id,
    meta: { branchId, branchName: branch.name },
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/branches");
  return { success: true };
};
