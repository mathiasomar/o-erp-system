"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";
import { ActivityAction } from "@/generated/prisma/enums";
import { calculatePointsEarned } from "@/lib/loyalty";
import prisma from "@/lib/prisma";
import { requireBranchContext } from "@/lib/branch-context";

// ── schemas ───────────────────────────────────────────────────────────────────

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type CustomerValues = z.infer<typeof customerSchema>;

// ── create ────────────────────────────────────────────────────────────────────

export const createCustomer = async (values: CustomerValues) => {
  const ctx = await requireBranchContext();
  const parsed = customerSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  // Uniqueness now scoped to branch (matches @@unique([phone, branchId]))
  if (parsed.data.phone) {
    const exists = await prisma.customer.findFirst({
      where: { phone: parsed.data.phone, branchId: ctx.branchId },
    });
    if (exists) {
      return {
        success: false,
        error: { phone: ["Phone already registered in this branch"] },
      };
    }
  }
  if (parsed.data.email) {
    const exists = await prisma.customer.findFirst({
      where: { email: parsed.data.email, branchId: ctx.branchId },
    });
    if (exists) {
      return {
        success: false,
        error: { email: ["Email already registered in this branch"] },
      };
    }
  }

  const customer = await prisma.customer.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
      branchId: ctx.branchId, // ← attach to branch
    },
  });

  await logActivity({
    action: ActivityAction.CUSTOMER_CREATED,
    entity: "Customer",
    entityId: customer.id,
    entityLabel: customer.name,
    userId: ctx.userId,
    branchId: ctx.branchId,
    meta: { phone: customer.phone, email: customer.email },
  });

  revalidatePath("/dashboard/customers");
  return { success: true, customer };
};

// ── update ────────────────────────────────────────────────────────────────────

export const updateCustomer = async (id: string, values: CustomerValues) => {
  const ctx = await requireBranchContext();
  const parsed = customerSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  if (parsed.data.phone) {
    const exists = await prisma.customer.findFirst({
      where: { phone: parsed.data.phone, branchId: ctx.branchId, NOT: { id } },
    });
    if (exists) {
      return {
        success: false,
        error: { phone: ["Phone already registered in this branch"] },
      };
    }
  }
  if (parsed.data.email) {
    const exists = await prisma.customer.findFirst({
      where: { email: parsed.data.email, branchId: ctx.branchId, NOT: { id } },
    });
    if (exists) {
      return {
        success: false,
        error: { email: ["Email already registered in this branch"] },
      };
    }
  }

  // Ensure the customer belongs to this branch before updating
  const customer = await prisma.customer.update({
    where: { id, branchId: ctx.branchId },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
    },
  });

  await logActivity({
    action: ActivityAction.CUSTOMER_UPDATED,
    entity: "Customer",
    entityId: customer.id,
    entityLabel: customer.name,
    userId: ctx.userId,
    branchId: ctx.branchId,
  });

  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${id}`);
  return { success: true, customer };
};

// ── toggle active ─────────────────────────────────────────────────────────────

export const toggleCustomerStatus = async (id: string) => {
  const ctx = await requireBranchContext();

  // Scope lookup to branch — prevents cross-branch tampering
  const customer = await prisma.customer.findFirst({
    where: { id, branchId: ctx.branchId },
  });
  if (!customer) return { success: false, error: "Not found" };

  await prisma.customer.update({
    where: { id },
    data: { isActive: !customer.isActive },
  });

  revalidatePath("/dashboard/customers");
  return { success: true, isActive: !customer.isActive };
};

// ── adjust points manually ────────────────────────────────────────────────────

const adjustSchema = z.object({
  points: z.number().int(),
  description: z.string().optional(),
});

export const adjustLoyaltyPoints = async (
  customerId: string,
  points: number,
  description: string = "Manual adjustment",
) => {
  const ctx = await requireBranchContext();
  const parsed = adjustSchema.safeParse({ points, description });
  if (!parsed.success) return { success: false, error: "Invalid data" };

  // Scope lookup to branch
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, branchId: ctx.branchId },
  });
  if (!customer) return { success: false, error: "Customer not found" };

  const newPoints = Math.max(0, customer.points + parsed.data.points);

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: customerId },
      data: { points: newPoints },
    }),
    prisma.loyaltyLog.create({
      data: {
        customerId,
        points: parsed.data.points,
        type: parsed.data.points >= 0 ? "ADJUSTED" : "REDEEMED",
        description: parsed.data.description,
      },
    }),
  ]);

  revalidatePath(`/dashboard/customers/${customerId}`);
  return { success: true, newPoints };
};

// ── award points after order ──────────────────────────────────────────────────
// No branch context needed here — orderId already proves the order's branch,
// and customerId is already scoped correctly when the order was created.

export const awardOrderPoints = async (
  customerId: string,
  orderId: string,
  orderTotal: number,
) => {
  const points = calculatePointsEarned(orderTotal);
  if (points <= 0) return;

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: customerId },
      data: { points: { increment: points } },
    }),
    prisma.loyaltyLog.create({
      data: {
        customerId,
        orderId,
        points,
        type: "EARNED",
        description: `Earned from order — KES ${orderTotal.toLocaleString()}`,
      },
    }),
  ]);
};
