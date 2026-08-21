import prisma from "@/lib/prisma";
import { NotificationType } from "@/generated/prisma/enums";
import { sendEmail } from "./email";
import {
  expenseTemplate,
  lowStockTemplate,
  newOrderTemplate,
} from "./email-template";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type NotifyInput = {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  roles?: string[];
  userId?: string;
  meta?: Record<string, JsonValue>;
};

export const notify = async (input: NotifyInput) => {
  // ── 1. In-app notification (existing behavior) ────────────────────────────
  await prisma.notification.create({
    data: {
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
      userId: input.userId ?? null,
      roles: input.roles ?? [],
      meta: input.meta ?? {},
    },
  });

  // ── 2. Email notification ──────────────────────────────────────────────────
  try {
    const emailSettings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            "notify_email",
            "notify_new_order",
            "notify_low_stock",
            "company_name",
          ],
        },
      },
      select: { key: true, value: true },
    });

    const cfg = Object.fromEntries(emailSettings.map((s) => [s.key, s.value]));

    const alertEmail = cfg.notify_email;
    const storeName = cfg.company_name || "POS System";

    if (!alertEmail) return; // no email configured — done

    // Determine which events should send email
    const emailEnabled = {
      newOrder: cfg.notify_new_order !== "false",
      lowStock: cfg.notify_low_stock !== "false",
      expense: true, // always send expense emails if email is configured
    };

    let subject = "";
    let html = "";

    // ── New order ──────────────────────────────────────────────────────────
    if (
      input.type === NotificationType.NEW_ORDER &&
      emailEnabled.newOrder &&
      input.meta
    ) {
      subject = `New order — ${input.meta.orderNumber ?? ""}`;
      html = newOrderTemplate({
        orderNumber: String(input.meta.orderNumber ?? ""),
        total: Number(input.meta.total ?? 0),
        items: (input.meta.items as never) ?? [],
        paymentMethod: String(input.meta.method ?? ""),
        cashierName: String(input.meta.cashier ?? "Unknown"),
        branchName: String(input.meta.branchName ?? ""),
        storeName,
      });
    }

    // ── Low / out of stock ─────────────────────────────────────────────────
    else if (
      (input.type === NotificationType.LOW_STOCK ||
        input.type === NotificationType.OUT_OF_STOCK) &&
      emailEnabled.lowStock
    ) {
      subject = `${input.title} — ${storeName}`;
      html = lowStockTemplate({
        products: [
          {
            name: String(input.meta?.productName ?? ""),
            sku: String(input.meta?.sku ?? ""),
            quantity: Number(input.meta?.quantity ?? 0),
            threshold: Number(input.meta?.threshold ?? 0),
          },
        ],
        branchName: String(input.meta?.branchName ?? ""),
        storeName,
      });
    }

    // ── Expense added ──────────────────────────────────────────────────────
    else if (
      input.type === NotificationType.EXPENSE_ADDED &&
      emailEnabled.expense
    ) {
      subject = `New expense recorded — ${storeName}`;
      html = expenseTemplate({
        title: input.title,
        amount: Number(input.meta?.amount ?? 0),
        category: String(input.meta?.category ?? "Uncategorised"),
        addedBy: String(input.meta?.addedBy ?? "Unknown"),
        branchName: String(input.meta?.branchName ?? ""),
        storeName,
      });
    }

    if (subject && html) {
      await sendEmail({ to: alertEmail, subject, html });
    }
  } catch (err) {
    // Never let email failure break the app
    console.error("[notify] Email send failed:", err);
  }
};
