import * as XLSX from "xlsx";
import { format } from "date-fns";

type SheetData = {
  name: string;
  rows: (string | number | boolean | null | undefined)[][];
};

export const buildExcelWorkbook = (sheets: SheetData[]): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, rows }) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Auto column widths
    const colWidths = rows.reduce<number[]>((acc, row) => {
      row.forEach((cell, i) => {
        const len = String(cell ?? "").length;
        acc[i] = Math.max(acc[i] ?? 8, Math.min(len + 2, 40));
      });
      return acc;
    }, []);
    ws["!cols"] = colWidths.map((w) => ({ wch: w }));

    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  return wb;
};

export const downloadWorkbook = (wb: XLSX.WorkBook, filename: string) => {
  XLSX.writeFile(wb, `${filename}-${format(new Date(), "yyyyMMdd-HHmm")}.xlsx`);
};

// ── Domain-specific row builders ──────────────────────────────────────────────

export const ordersToRows = (orders: OrderExport[]): SheetData => ({
  name: "Orders",
  rows: [
    [
      "Order #",
      "Status",
      "Subtotal",
      "Discount",
      "Tax",
      "Total",
      "Payment Method",
      "M-Pesa Ref",
      "Cashier",
      "Date",
    ],
    ...orders.map((o) => [
      o.orderNumber,
      o.status,
      o.subtotal,
      o.discount,
      o.tax,
      o.total,
      o.payment?.method ?? "—",
      o.payment?.mpesaRef ?? "—",
      o.user?.name ?? "Unknown",
      format(new Date(o.createdAt), "dd MMM yyyy HH:mm"),
    ]),
  ],
});

export const orderItemsToRows = (orders: OrderExport[]): SheetData => ({
  name: "Order Items",
  rows: [
    ["Order #", "Product", "SKU", "Qty", "Unit Price", "Total"],
    ...orders.flatMap((o) =>
      o.items.map((item) => [
        o.orderNumber,
        item.productName,
        item.sku,
        item.quantity,
        item.unitPrice,
        item.total,
      ]),
    ),
  ],
});

export const productsToRows = (products: ProductExport[]): SheetData => ({
  name: "Products",
  rows: [
    [
      "Name",
      "SKU",
      "Category",
      "Price",
      "Cost Price",
      "Stock",
      "Low Stock At",
      "Tax Rate",
      "Discount",
      "Active",
    ],
    ...products.map((p) => [
      p.name,
      p.sku,
      p.category?.name ?? "—",
      p.price,
      p.costPrice ?? "—",
      p.stock?.quantity ?? 0,
      p.stock?.lowStockAt ?? 0,
      p.taxRate ?? 0,
      p.discount ?? 0,
      p.isActive ? "Yes" : "No",
    ]),
  ],
});

export const expensesToRows = (expenses: ExpenseExport[]): SheetData => ({
  name: "Expenses",
  rows: [
    ["Title", "Amount", "Category", "Date", "Logged By", "Notes"],
    ...expenses.map((e) => [
      e.title,
      e.amount,
      e.category?.name ?? "—",
      format(new Date(e.date), "dd MMM yyyy"),
      e.user?.name ?? "—",
      e.notes ?? "",
    ]),
  ],
});

export const usersToRows = (users: UserExport[]): SheetData => ({
  name: "Users",
  rows: [
    [
      "Name",
      "Email",
      "Role",
      "Active",
      "Orders",
      "Expenses",
      "Activities",
      "Joined",
    ],
    ...users.map((u) => [
      u.name,
      u.email,
      u.role,
      u.isActive ? "Yes" : "No",
      u._count.orders,
      u._count.expenses,
      u._count.activityLogs,
      format(new Date(u.createdAt), "dd MMM yyyy"),
    ]),
  ],
});

export const stockLogsToRows = (logs: StockLogExport[]): SheetData => ({
  name: "Stock Movement",
  rows: [
    [
      "Product",
      "Category",
      "Reason",
      "Change",
      "Before",
      "After",
      "Note",
      "Date",
    ],
    ...logs.map((l) => [
      l.stock.product.name,
      l.stock.product.category?.name ?? "—",
      l.reason,
      l.change,
      l.quantityBefore,
      l.quantityAfter,
      l.note ?? "",
      format(new Date(l.createdAt), "dd MMM yyyy HH:mm"),
    ]),
  ],
});

// ── Types ─────────────────────────────────────────────────────────────────────

type OrderExport = {
  orderNumber: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  createdAt: string;
  payment: { method: string; mpesaRef?: string | null } | null;
  user: { name: string } | null;
  items: {
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
};

type ProductExport = {
  name: string;
  sku: string;
  price: number;
  costPrice?: number | null;
  taxRate?: number | null;
  discount?: number | null;
  isActive: boolean;
  category: { name: string } | null;
  stock: { quantity: number; lowStockAt: number } | null;
};

type ExpenseExport = {
  title: string;
  amount: number;
  date: string;
  notes?: string | null;
  category: { name: string } | null;
  user: { name: string } | null;
};

type UserExport = {
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: { orders: number; expenses: number; activityLogs: number };
};

type StockLogExport = {
  reason: string;
  change: number;
  quantityBefore: number;
  quantityAfter: number;
  note?: string | null;
  createdAt: string;
  stock: { product: { name: string; category: { name: string } | null } };
};
