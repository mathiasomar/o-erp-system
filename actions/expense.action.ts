"use server";

import { revalidatePath } from "next/cache";
import {
  expenseSchema,
  expenseCategorySchema,
  ExpenseFormValues,
  ExpenseCategoryFormValues,
} from "@/lib/validations/expense";
import prisma from "@/lib/prisma";
import {
  ActivityAction,
  ExpenseFrequency,
  ExpensePaymentMethod,
  NotificationType,
} from "@/generated/prisma/enums";
import { notify } from "@/lib/notify";
import { logActivity } from "@/lib/activity-logger";
import { requireBranchContext } from "@/lib/branch-context";

// ── Expense categories — global, not per branch ───────────────────────────────

export const createExpenseCategory = async (
  values: ExpenseCategoryFormValues,
) => {
  const ctx = await requireBranchContext();
  const parsed = expenseCategorySchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }
  const existing = await prisma.expenseCategory.findUnique({
    where: { name: parsed.data.name, branchId: ctx.branchId },
  });
  if (existing) {
    return { success: false, error: { name: ["Category already exists"] } };
  }
  const category = await prisma.expenseCategory.create({
    data: { ...parsed.data, branchId: ctx.branchId },
  });
  revalidatePath("/dashboard/expenses");
  return { success: true, category };
};

export const updateExpenseCategory = async (
  id: string,
  values: ExpenseCategoryFormValues,
) => {
  const parsed = expenseCategorySchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }
  const existing = await prisma.expenseCategory.findFirst({
    where: { name: parsed.data.name, NOT: { id } },
  });
  if (existing) {
    return { success: false, error: { name: ["Category already exists"] } };
  }
  const category = await prisma.expenseCategory.update({
    where: { id },
    data: parsed.data,
  });
  revalidatePath("/dashboard/expenses");
  return { success: true, category };
};

export const deleteExpenseCategory = async (id: string) => {
  await prisma.expenseCategory.delete({ where: { id } });
  revalidatePath("/dashboard/expenses");
  return { success: true };
};

// ── Expenses — branch-scoped ──────────────────────────────────────────────────

export const createExpense = async (values: ExpenseFormValues) => {
  const ctx = await requireBranchContext();
  const parsed = expenseSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const expense = await prisma.expense.create({
    data: {
      ...parsed.data,
      userId: ctx.userId,
      branchId: ctx.branchId,
      date: new Date(parsed.data.date),
      receiptUrl: parsed.data.receiptUrl || null,
      note: parsed.data.note || null,
      categoryId: parsed.data.categoryId || null,
      paymentMethod: parsed.data.paymentMethod as ExpensePaymentMethod,
      frequency: parsed.data.frequency as ExpenseFrequency,
    },
  });

  await logActivity({
    action: ActivityAction.EXPENSE_CREATED,
    entity: "Expense",
    entityId: expense.id,
    entityLabel: expense.title,
    userId: ctx.userId,
    branchId: ctx.branchId,
    meta: { amount: expense.amount },
  });

  await notify({
    type: NotificationType.EXPENSE_ADDED,
    title: "New expense recorded",
    message: `${expense.title} — KES ${expense.amount.toLocaleString()}`,
    link: `/dashboard/expenses`,
    roles: ["ADMIN", "MANAGER"],
    meta: {
      amount: expense.amount,
      category: values.categoryId ?? null,
      addedBy: ctx.userId ?? "",
      branchId: ctx.branchId,
    },
  });

  revalidatePath("/dashboard/expenses");
  return { success: true, expense };
};

export const updateExpense = async (id: string, values: ExpenseFormValues) => {
  const ctx = await requireBranchContext();
  const parsed = expenseSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const expense = await prisma.expense.update({
    where: { id, branchId: ctx.branchId },
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
      receiptUrl: parsed.data.receiptUrl || null,
      note: parsed.data.note || null,
      categoryId: parsed.data.categoryId || null,
      paymentMethod: parsed.data.paymentMethod as ExpensePaymentMethod,
      frequency: parsed.data.frequency as ExpenseFrequency,
    },
  });

  await logActivity({
    action: ActivityAction.EXPENSE_UPDATED,
    entity: "Expense",
    entityId: expense.id,
    entityLabel: expense.title,
    userId: ctx.userId,
    branchId: ctx.branchId,
    meta: { amount: expense.amount },
  });

  revalidatePath("/dashboard/expenses");
  return { success: true, expense };
};

export const deleteExpenses = async (ids: string[]) => {
  const ctx = await requireBranchContext();
  await prisma.expense.deleteMany({
    where: { id: { in: ids }, branchId: ctx.branchId },
  });
  await logActivity({
    action: ActivityAction.EXPENSE_DELETED,
    entity: "Expense",
    entityLabel: `${ids.length} expense(s)`,
    userId: ctx.userId,
    branchId: ctx.branchId,
    meta: { ids: ids.join(",") },
  });
  revalidatePath("/dashboard/expenses");
  return { success: true };
};
