"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireBranchContext } from "@/lib/branch-context";
import { logActivity } from "@/lib/activity-logger";
import { ActivityAction } from "@/generated/prisma/enums";

// ── Helpers ───────────────────────────────────────────────────────────────────

const generatePurchaseNumber = async (branchId: string): Promise<string> => {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { code: true },
  });
  const count = await prisma.purchase.count({ where: { branchId } });
  const prefix = branch?.code?.slice(0, 4).toUpperCase() ?? "PO";
  return `${prefix}-PO-${String(count + 1).padStart(5, "0")}`;
};

// ── Item schema ───────────────────────────────────────────────────────────────

const purchaseItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().optional(),
  sku: z.string().optional(),
  orderedQty: z.number().int().min(1),
  unitCostExcl: z.number().min(0), // cost excluding tax
  taxRate: z.number().min(0).max(100),
  updateCostPrice: z.boolean(),
}).refine((data) => {
  // Either productId should be set, or both productName and sku should be set
  if (data.productId) return true;
  return !!(data.productName && data.sku);
}, {
  message: "Either select a product or provide product name and SKU",
});

// ── Purchase schema ───────────────────────────────────────────────────────────

const purchaseSchema = z.object({
  supplierId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  expectedDate: z.string().optional(),
  paymentMethod: z.enum(["CASH", "MPESA", "CARD", "BANK_TRANSFER"]).optional(),
  discountAmount: z.number().min(0),
  shippingCost: z.number().min(0),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "At least one item required"),
});

export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;
export type PurchaseInput = z.infer<typeof purchaseSchema>;

// ── Compute item financials ───────────────────────────────────────────────────

const computeItem = (item: PurchaseItemInput) => {
  const taxRate = item.taxRate / 100;
  const unitCostIncl = item.unitCostExcl * (1 + taxRate);
  const taxAmount = item.unitCostExcl * taxRate * item.orderedQty;
  const subtotal = item.unitCostExcl * item.orderedQty;
  const total = unitCostIncl * item.orderedQty;
  return { unitCostIncl, taxAmount, subtotal, total };
};

// ── Create purchase (draft) ───────────────────────────────────────────────────

export const createPurchase = async (input: PurchaseInput) => {
  const ctx = await requireBranchContext();
  const parsed = purchaseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const { items, discountAmount, shippingCost, ...orderData } = parsed.data;

  // Auto-create products that don't exist
  const itemsWithProducts = await Promise.all(
    items.map(async (item) => {
      if (item.productId) {
        // Product already selected, use it
        return { ...item, productId: item.productId };
      }

      // No productId provided, need to find or create product
      if (!item.productName || !item.sku) {
        // Skip items without product info
        return item;
      }

      // Check if product with this SKU already exists
      const existingProduct = await prisma.product.findUnique({
        where: { 
          sku_branchId: { 
            sku: item.sku!, 
            branchId: ctx.branchId 
          } 
        },
      });

      if (existingProduct) {
        // Use existing product
        return { ...item, productId: existingProduct.id };
      }

      // Create new product
      const newProduct = await prisma.product.create({
        data: {
          name: item.productName!,
          sku: item.sku!,
          price: item.unitCostExcl * 1.5, // Default selling price (markup)
          costPrice: item.unitCostExcl,
          costPriceInclTax: item.unitCostExcl * (1 + item.taxRate / 100),
          purchaseTaxRate: item.taxRate,
          branchId: ctx.branchId,
          stock: {
            create: {
              quantity: 0,
              lowStockAt: 10,
              branchId: ctx.branchId,
            },
          },
        },
      });

      await logActivity({
        action: ActivityAction.PRODUCT_CREATED,
        entity: "Product",
        entityId: newProduct.id,
        entityLabel: newProduct.name,
        userId: ctx.userId,
        branchId: ctx.branchId,
        meta: { sku: newProduct.sku, autoCreated: true },
      });

      return { ...item, productId: newProduct.id };
    })
  );

  // Compute totals
  const computedItems = itemsWithProducts.map((item) => ({
    ...item,
    ...computeItem(item),
  }));

  const subtotal = computedItems.reduce((s, i) => s + i.subtotal, 0);
  const taxAmount = computedItems.reduce((s, i) => s + i.taxAmount, 0);
  const total =
    subtotal + taxAmount + (shippingCost ?? 0) - (discountAmount ?? 0);

  const purchaseNumber = await generatePurchaseNumber(ctx.branchId);

  const purchase = await prisma.purchase.create({
    data: {
      purchaseNumber,
      branchId: ctx.branchId,
      userId: ctx.userId,
      status: "DRAFT",
      paymentStatus: "UNPAID",
      supplierId: orderData.supplierId || null,
      invoiceNumber: orderData.invoiceNumber || null,
      invoiceDate: orderData.invoiceDate
        ? new Date(orderData.invoiceDate)
        : null,
      expectedDate: orderData.expectedDate
        ? new Date(orderData.expectedDate)
        : null,
      paymentMethod: orderData.paymentMethod || null,
      notes: orderData.notes || null,
      discountAmount: discountAmount ?? 0,
      shippingCost: shippingCost ?? 0,
      subtotal,
      taxAmount,
      total,
      balanceDue: total,
      items: {
        create: computedItems.map((item) => ({
          productId: item.productId!,
          productName: item.productName || "",
          sku: item.sku || "",
          orderedQty: item.orderedQty,
          receivedQty: 0,
          unitCostExcl: item.unitCostExcl,
          unitCostIncl: item.unitCostIncl,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          subtotal: item.subtotal,
          total: item.total,
          updateCostPrice: item.updateCostPrice,
        })),
      },
    },
    include: { items: true, supplier: true },
  });

  await logActivity({
    action: ActivityAction.PURCHASE_CREATED,
    entity: "Purchase",
    entityId: purchase.id,
    entityLabel: purchase.purchaseNumber,
    userId: ctx.userId,
    branchId: ctx.branchId,
    meta: { total, items: computedItems.length },
  });

  revalidatePath("/dashboard/purchases");
  revalidatePath("/dashboard/products");
  return { success: true, purchase };
};

// ── Receive inventory (by invoice) ───────────────────────────────────────────
// receiveItems: array of { purchaseItemId, receivedQty }
// This is the "receive inventory by invoice" feature

const receiveSchema = z.object({
  purchaseId: z.string(),
  items: z.array(
    z.object({
      purchaseItemId: z.string(),
      receivedQty: z.number().int().min(0),
    }),
  ),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  notes: z.string().optional(),
});

export type ReceiveInventoryInput = z.infer<typeof receiveSchema>;

export const receiveInventory = async (input: ReceiveInventoryInput) => {
  const ctx = await requireBranchContext();
  const parsed = receiveSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const { purchaseId, items, invoiceNumber, invoiceDate, notes } = parsed.data;

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId, branchId: ctx.branchId },
    include: { items: { include: { product: true } } },
  });

  if (!purchase) return { success: false, error: "Purchase not found" };
  if (purchase.status === "CANCELLED") {
    return { success: false, error: "Cannot receive a cancelled purchase" };
  }
  if (purchase.status === "RECEIVED") {
    return { success: false, error: "Purchase already fully received" };
  }

  await prisma.$transaction(async (tx) => {
    for (const receiveItem of items) {
      if (receiveItem.receivedQty === 0) continue;

      const purchaseItem = purchase.items.find(
        (i) => i.id === receiveItem.purchaseItemId,
      );
      if (!purchaseItem) continue;

      const canReceive = purchaseItem.orderedQty - purchaseItem.receivedQty;
      const qty = Math.min(receiveItem.receivedQty, canReceive);
      if (qty <= 0) continue;

      // ── Update received qty on purchase item ──────────────────────────────
      await tx.purchaseItem.update({
        where: { id: purchaseItem.id },
        data: { receivedQty: { increment: qty } },
      });

      // ── Update stock ──────────────────────────────────────────────────────
      if (purchaseItem.productId) {
        const stock = await tx.stock.findUnique({
          where: { productId: purchaseItem.productId },
        });

        if (stock) {
          const before = stock.quantity;
          const after = before + qty;

          await tx.stock.update({
            where: { productId: purchaseItem.productId },
            data: { quantity: { increment: qty } },
          });

          // Log the stock movement
          await tx.stockLog.create({
            data: {
              stockId: stock.id,
              productId: purchaseItem.productId,
              reason: "PURCHASE_RECEIVED",
              quantityBefore: before,
              quantityAfter: after,
              change: qty,
              note: `Received via ${purchase.purchaseNumber}${
                invoiceNumber ? ` / Invoice ${invoiceNumber}` : ""
              }`,
            },
          });

          // ── Update product cost price if flagged ────────────────────────
          if (purchaseItem.updateCostPrice) {
            await tx.product.update({
              where: { id: purchaseItem.productId },
              data: {
                costPrice: purchaseItem.unitCostExcl,
                costPriceInclTax: purchaseItem.unitCostIncl,
                purchaseTaxRate: purchaseItem.taxRate,
              },
            });
          }
        }
      }
    }

    // ── Determine new purchase status ─────────────────────────────────────
    // Re-fetch updated items
    const updatedItems = await tx.purchaseItem.findMany({
      where: { purchaseId },
    });

    const allReceived = updatedItems.every(
      (i) => i.receivedQty >= i.orderedQty,
    );
    const anyReceived = updatedItems.some((i) => i.receivedQty > 0);
    const newStatus = allReceived
      ? "RECEIVED"
      : anyReceived
        ? "PARTIAL"
        : "ORDERED";

    await tx.purchase.update({
      where: { id: purchaseId },
      data: {
        status: newStatus,
        receivedDate: allReceived ? new Date() : undefined,
        invoiceNumber: invoiceNumber || undefined,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
        notes: notes || undefined,
      },
    });
  });

  await logActivity({
    action: ActivityAction.PURCHASE_RECEIVED,
    entity: "Purchase",
    entityId: purchaseId,
    entityLabel: purchase.purchaseNumber,
    userId: ctx.userId,
    branchId: ctx.branchId,
    meta: { invoiceNumber: invoiceNumber ?? null, items: items.length },
  });

  revalidatePath("/dashboard/purchases");
  revalidatePath("/dashboard/inventory");
  return { success: true };
};

// ── Add payment to purchase ───────────────────────────────────────────────────

export const addPurchasePayment = async (
  purchaseId: string,
  amount: number,
  method: "CASH" | "MPESA" | "CARD" | "BANK_TRANSFER",
  reference?: string,
  note?: string,
) => {
  const ctx = await requireBranchContext();

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId, branchId: ctx.branchId },
  });
  if (!purchase) return { success: false, error: "Purchase not found" };

  const newAmountPaid = purchase.amountPaid + amount;
  const newBalance = purchase.total - newAmountPaid;
  const paymentStatus =
    newBalance <= 0 ? "PAID" : newAmountPaid > 0 ? "PARTIAL" : "UNPAID";

  await prisma.$transaction([
    prisma.purchasePayment.create({
      data: {
        purchaseId,
        amount,
        method,
        reference: reference || null,
        note: note || null,
      },
    }),
    prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        amountPaid: newAmountPaid,
        balanceDue: Math.max(0, newBalance),
        paymentStatus,
        paymentMethod: method,
      },
    }),
  ]);

  revalidatePath("/dashboard/purchases");
  return { success: true };
};

// ── Cancel purchase ───────────────────────────────────────────────────────────

export const cancelPurchase = async (id: string) => {
  const ctx = await requireBranchContext();

  const purchase = await prisma.purchase.findUnique({
    where: { id, branchId: ctx.branchId },
  });
  if (!purchase) return { success: false, error: "Purchase not found" };
  if (purchase.status === "RECEIVED") {
    return { success: false, error: "Cannot cancel a received purchase" };
  }

  await prisma.purchase.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  await logActivity({
    action: ActivityAction.PURCHASE_CANCELLED,
    entity: "Purchase",
    entityId: id,
    entityLabel: purchase.purchaseNumber,
    userId: ctx.userId,
    branchId: ctx.branchId,
  });

  revalidatePath("/dashboard/purchases");
  return { success: true };
};
