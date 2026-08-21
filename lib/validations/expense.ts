import { z } from "zod";

export const expenseCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  icon: z.string().optional(),
  branchId: z.string().optional(),
});

export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z
    .number({
      error: "Amount must be a number",
    })
    .min(0.01, "Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  note: z.string().optional(),
  receiptUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  paymentMethod: z.enum(["CASH", "MPESA", "CARD", "BANK_TRANSFER"]),
  frequency: z.enum(["ONE_TIME", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  isRecurring: z.boolean(),
  categoryId: z.string().optional(),
});

export type ExpenseCategoryFormValues = z.infer<typeof expenseCategorySchema>;
export type ExpenseFormValues = z.infer<typeof expenseSchema>;
