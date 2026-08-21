"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { ActivityAction } from "@/generated/prisma/enums";

// ── Schemas ───────────────────────────────────────────────────────────────────

const createUserSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    username: z.string().regex(/^[a-z][a-z0-9_]{2,19}$/, "Invalid username"),
    password: z.string().min(8, "Minimum 8 characters"),
    role: z.enum(["ADMIN", "MANAGER", "CASHIER"]),
    branchId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role !== "ADMIN" && !data.branchId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Branch is required for Manager and Cashier",
        path: ["branchId"],
      });
    }
  });

const updateUserSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    username: z.string().regex(/^[a-z][a-z0-9_]{2,19}$/, "Invalid username"),
    role: z.enum(["ADMIN", "MANAGER", "CASHIER"]),
    isActive: z.boolean(),
    branchId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role !== "ADMIN" && !data.branchId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Branch is required for Manager and Cashier",
        path: ["branchId"],
      });
    }
  });

export type CreateUserValues = z.infer<typeof createUserSchema>;
export type UpdateUserValues = z.infer<typeof updateUserSchema>;

// ── Assert admin ──────────────────────────────────────────────────────────────

const assertAdmin = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") throw new Error("Admin only");
  return session!.user;
};

// ── Create ────────────────────────────────────────────────────────────────────

export const createUser = async (values: CreateUserValues) => {
  try {
    await assertAdmin();
  } catch {
    return { success: false, error: "Admin access required" };
  }

  const parsed = createUserSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const existingEmail = await prisma.user.findFirst({
    where: {
      OR: [{ email: parsed.data.email }, { username: parsed.data.username }],
    },
  });
  if (existingEmail) {
    return {
      success: false,
      error: { email: ["Email or Username already in use"] },
    };
  }

  if (parsed.data.branchId) {
    const branch = await prisma.branch.findUnique({
      where: { id: parsed.data.branchId },
    });
    if (!branch) {
      return { success: false, error: { branchId: ["Branch not found"] } };
    }
    if (!branch.isActive) {
      return { success: false, error: { branchId: ["Branch is inactive"] } };
    }
  }

  await auth.api.signUpEmail({
    body: {
      name: parsed.data.name,
      email: parsed.data.email,
      username: parsed.data.username,
      password: parsed.data.password,
    },
  });

  await prisma.user.update({
    where: { email: parsed.data.email },
    data: {
      role: parsed.data.role,
      branchId:
        parsed.data.role === "ADMIN" ? null : (parsed.data.branchId ?? null),
    },
  });

  await logActivity({
    action: ActivityAction.USER_CREATED,
    entity: "User",
    entityLabel: parsed.data.name,
    meta: {
      email: parsed.data.email,
      role: parsed.data.role,
      branchId: parsed.data.branchId ?? null,
    },
  });

  revalidatePath("/dashboard/users");
  return { success: true };
};

// ── Update ────────────────────────────────────────────────────────────────────

export const updateUser = async (id: string, values: UpdateUserValues) => {
  try {
    await assertAdmin();
  } catch {
    return { success: false, error: "Admin access required" };
  }

  const parsed = updateUserSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const emailTaken = await prisma.user.findFirst({
    where: { email: parsed.data.email, NOT: { id } },
  });
  if (emailTaken) {
    return { success: false, error: { email: ["Email already in use"] } };
  }

  // Last admin guard
  if (parsed.data.role !== "ADMIN") {
    const target = await prisma.user.findUnique({ where: { id } });
    if (target?.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return {
          success: false,
          error: "Cannot change role — must have at least one Admin",
        };
      }
    }
  }

  await prisma.user.update({
    where: { id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      isActive: parsed.data.isActive,
      branchId:
        parsed.data.role === "ADMIN" ? null : (parsed.data.branchId ?? null),
    },
  });

  await logActivity({
    action: ActivityAction.USER_UPDATED,
    entity: "User",
    entityId: id,
    entityLabel: parsed.data.name,
    meta: {
      email: parsed.data.email,
      role: parsed.data.role,
      branchId: parsed.data.branchId ?? null,
    },
  });

  revalidatePath("/dashboard/users");
  revalidatePath(`/dashboard/users/${id}`);
  return { success: true };
};

// ── Toggle status ─────────────────────────────────────────────────────────────

export const toggleUserStatus = async (id: string) => {
  try {
    await assertAdmin();
  } catch {
    return { success: false, error: "Admin access required" };
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { success: false, error: "User not found" };

  // Last active admin guard
  if (user.role === "ADMIN" && user.isActive) {
    const count = await prisma.user.count({
      where: { role: "ADMIN", isActive: true },
    });
    if (count <= 1) {
      return {
        success: false,
        error: "Cannot deactivate the last active Admin",
      };
    }
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });

  await logActivity({
    action: user.isActive
      ? ActivityAction.USER_DEACTIVATED
      : ActivityAction.USER_ACTIVATED,
    entity: "User",
    entityId: id,
    entityLabel: user.name,
    meta: { isActive: !user.isActive },
  });

  revalidatePath("/dashboard/users");
  revalidatePath(`/dashboard/users/${id}`);
  return { success: true, isActive: !user.isActive };
};

// ── Reset password ────────────────────────────────────────────────────────────

export const resetUserPassword = async (id: string, newPassword: string) => {
  try {
    await assertAdmin();
  } catch {
    return { success: false, error: "Admin access required" };
  }

  if (newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { success: false, error: "User not found" };

  await auth.api.changePassword({
    body: { currentPassword: "", newPassword },
    headers: await headers(),
  });

  revalidatePath(`/dashboard/users/${id}`);
  return { success: true };
};

// ── Delete ────────────────────────────────────────────────────────────────────

export const deleteUser = async (id: string) => {
  try {
    await assertAdmin();
  } catch {
    return { success: false, error: "Admin access required" };
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) return { success: false, error: "User not found" };

  // Cannot delete the last admin
  if (user.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return {
        success: false,
        error: "Cannot delete the last Admin account",
      };
    }
  }

  // Cannot delete yourself
  const session = await auth.api.getSession({ headers: await headers() });
  const selfId = session?.user?.id;
  if (selfId === id) {
    return { success: false, error: "You cannot delete your own account" };
  }

  await prisma.user.delete({ where: { id } });

  await logActivity({
    action: ActivityAction.USER_DELETE,
    entity: "User",
    entityId: id,
    entityLabel: user.name,
    meta: { email: user.email, role: user.role },
  });

  revalidatePath("/dashboard/users");
  return { success: true };
};

// ── Get users (branch-scoped) ─────────────────────────────────────────────────

export const getUsers = async (branchId?: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role;

  const where =
    role === "ADMIN" && branchId
      ? { branchId } // admin filtered to a branch
      : role === "ADMIN"
        ? {} // admin global — all users
        : {
            branchId:
              (session?.user as { branchId?: string } | undefined)?.branchId ??
              undefined,
          };

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      image: true,
      branchId: true,
      createdAt: true,
      updatedAt: true,
      branch: { select: { name: true, code: true } },
      _count: { select: { orders: true, expenses: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};
