"use server";

import { revalidatePath } from "next/cache";
import { categorySchema, CategoryFormValues } from "@/lib/validations/category";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { ActivityAction } from "@/generated/prisma/enums";
import { requireBranchContext } from "@/lib/branch-context";

export const getCategories = async () => {
  const ctx = await requireBranchContext();
  return prisma.category.findMany({
    where: { branchId: ctx.branchId },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
};

export const createCategory = async (values: CategoryFormValues) => {
  const ctx = await requireBranchContext();
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.category.findUnique({
    where: {
      name_branchId: { name: parsed.data.name, branchId: ctx.branchId },
    },
  });
  if (existing) {
    return {
      success: false,
      error: { name: ["Category name already exists"] },
    };
  }

  const category = await prisma.category.create({
    data: { ...parsed.data, branchId: ctx.branchId },
  });

  await logActivity({
    action: ActivityAction.CATEGORY_CREATED,
    entity: "Category",
    entityId: category.id,
    entityLabel: category.name,
    userId: ctx.userId,
    branchId: ctx.branchId,
  });

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/products");
  return { success: true, category };
};

export const updateCategory = async (
  id: string,
  values: CategoryFormValues,
) => {
  const ctx = await requireBranchContext();
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.category.findFirst({
    where: {
      name: parsed.data.name,
      branchId: ctx.branchId,
      NOT: { id },
    },
  });
  if (existing) {
    return {
      success: false,
      error: { name: ["Category name already exists"] },
    };
  }

  const category = await prisma.category.update({
    where: { id, branchId: ctx.branchId },
    data: parsed.data,
  });

  await logActivity({
    action: ActivityAction.CATEGORY_UPDATED,
    entity: "Category",
    entityId: category.id,
    entityLabel: category.name,
    userId: ctx.userId,
    branchId: ctx.branchId,
  });

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/products");
  return { success: true, category };
};

export const deleteCategories = async (ids: string[]) => {
  const ctx = await requireBranchContext();

  const categories = await prisma.category.findMany({
    where: { id: { in: ids }, branchId: ctx.branchId },
  });

  await prisma.category.deleteMany({
    where: { id: { in: categories.map((c) => c.id) } },
  });

  await Promise.all(
    categories.map((cat) =>
      logActivity({
        action: ActivityAction.CATEGORY_DELETED,
        entity: "Category",
        entityId: cat.id,
        entityLabel: cat.name,
        userId: ctx.userId,
        branchId: ctx.branchId,
      }),
    ),
  );

  revalidatePath("/dashboard/categories");
};
