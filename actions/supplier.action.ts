"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireBranchContext } from "@/lib/branch-context";
import { logActivity } from "@/lib/activity-logger";
import { ActivityAction } from "@/generated/prisma/enums";

const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  contactName: z.string().optional(),
  taxPin: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type SupplierValues = z.infer<typeof supplierSchema>;

export const createSupplier = async (values: SupplierValues) => {
  const ctx = await requireBranchContext();
  const parsed = supplierSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const supplier = await prisma.supplier.create({
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      contactName: parsed.data.contactName || null,
      taxPin: parsed.data.taxPin || null,
      notes: parsed.data.notes || null,
      branchId: ctx.branchId,
    },
  });

  await logActivity({
    action: ActivityAction.SUPPLIER_CREATED,
    entity: "Supplier",
    entityId: supplier.id,
    entityLabel: supplier.name,
    userId: ctx.userId,
    branchId: ctx.branchId,
  });

  revalidatePath("/dashboard/purchases/suppliers");
  return { success: true, supplier };
};

export const updateSupplier = async (id: string, values: SupplierValues) => {
  const ctx = await requireBranchContext();
  const parsed = supplierSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const supplier = await prisma.supplier.update({
    where: { id, branchId: ctx.branchId },
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      contactName: parsed.data.contactName || null,
      taxPin: parsed.data.taxPin || null,
      notes: parsed.data.notes || null,
    },
  });

  await logActivity({
    action: ActivityAction.SUPPLIER_UPDATED,
    entity: "Supplier",
    entityId: supplier.id,
    entityLabel: supplier.name,
    userId: ctx.userId,
    branchId: ctx.branchId,
  });

  revalidatePath("/dashboard/purchases/suppliers");
  return { success: true, supplier };
};

export const deleteSupplier = async (id: string) => {
  const ctx = await requireBranchContext();

  // Check if supplier has purchases
  const purchaseCount = await prisma.purchase.count({
    where: { supplierId: id },
  });
  if (purchaseCount > 0) {
    return {
      success: false,
      error: `Cannot delete — supplier has ${purchaseCount} purchase order${purchaseCount !== 1 ? "s" : ""}`,
    };
  }

  await prisma.supplier.delete({ where: { id, branchId: ctx.branchId } });
  revalidatePath("/dashboard/purchases/suppliers");
  return { success: true };
};
