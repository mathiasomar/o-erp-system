"use client";

import { useState } from "react";
import { api } from "@/lib/axios";
import { format } from "date-fns";
import {
  buildExcelWorkbook,
  downloadWorkbook,
  ordersToRows,
  orderItemsToRows,
  productsToRows,
  expensesToRows,
  usersToRows,
  stockLogsToRows,
} from "@/lib/export/excel-exporter";
import { buildPDF, downloadPDF } from "@/lib/export/pdf-exporter";
import { toast } from "sonner";

type DateRange = { from?: string; to?: string };

// ── Individual domain exports ─────────────────────────────────────────────────

export const useExportOrders = () => {
  const [loading, setLoading] = useState(false);

  const exportXLSX = async (range?: DateRange, status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (range?.from) params.set("from", range.from);
      if (range?.to) params.set("to", range.to);
      if (status) params.set("status", status);

      const { data } = await api.get(`/api/exports/orders?${params}`);
      const wb = buildExcelWorkbook([
        ordersToRows(data),
        orderItemsToRows(data),
      ]);
      downloadWorkbook(wb, "orders-export");
      toast.success(`${data.length} orders exported`);
    } catch {
      toast.error("Failed to export orders");
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async (range?: DateRange, status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (range?.from) params.set("from", range.from);
      if (range?.to) params.set("to", range.to);
      if (status) params.set("status", status);

      const { data } = await api.get(`/api/exports/orders?${params}`);

      const doc = buildPDF({
        title: "Orders Report",
        subtitle: range?.from
          ? `${format(new Date(range.from), "dd MMM yyyy")} – ${format(new Date(range.to ?? new Date()), "dd MMM yyyy")}`
          : "All time",
        company: "POS System",
        sections: [
          {
            title: "Orders",
            headers: [
              "Order #",
              "Status",
              "Total",
              "Method",
              "Cashier",
              "Date",
            ],
            rows: data.map(
              (o: {
                orderNumber: string;
                status: string;
                total: number;
                payment?: { method: string } | null;
                user?: { name: string } | null;
                createdAt: string;
              }) => [
                o.orderNumber,
                o.status,
                `KES ${o.total.toLocaleString()}`,
                o.payment?.method ?? "—",
                o.user?.name ?? "Unknown",
                format(new Date(o.createdAt), "dd MMM yyyy HH:mm"),
              ],
            ),
            colStyles: {
              2: { halign: "right" },
            },
          },
        ],
      });
      downloadPDF(doc, "orders-report");
    } catch {
      toast.error("Failed to export orders PDF");
    } finally {
      setLoading(false);
    }
  };

  return { exportXLSX, exportPDF, loading };
};

// ── Products ──────────────────────────────────────────────────────────────────

export const useExportProducts = () => {
  const [loading, setLoading] = useState(false);

  const exportXLSX = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/exports/products");
      const wb = buildExcelWorkbook([productsToRows(data)]);
      downloadWorkbook(wb, "products-export");
      toast.success(`${data.length} products exported`);
    } catch {
      toast.error("Failed to export products");
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/exports/products");
      const doc = buildPDF({
        title: "Products Report",
        subtitle: `${data.length} products`,
        company: "POS System",
        sections: [
          {
            title: "Products",
            headers: ["Name", "SKU", "Category", "Price", "Stock", "Active"],
            rows: data.map(
              (p: {
                name: string;
                sku: string;
                category?: { name: string } | null;
                price: number;
                stock?: { quantity: number } | null;
                isActive: boolean;
              }) => [
                p.name,
                p.sku,
                p.category?.name ?? "—",
                `KES ${p.price.toLocaleString()}`,
                p.stock?.quantity ?? 0,
                p.isActive ? "Yes" : "No",
              ],
            ),
          },
        ],
      });
      downloadPDF(doc, "products-report");
    } catch {
      toast.error("Failed to export products PDF");
    } finally {
      setLoading(false);
    }
  };

  return { exportXLSX, exportPDF, loading };
};

// ── Expenses ──────────────────────────────────────────────────────────────────

export const useExportExpenses = () => {
  const [loading, setLoading] = useState(false);

  const exportXLSX = async (range?: DateRange) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (range?.from) params.set("from", range.from);
      if (range?.to) params.set("to", range.to);

      const { data } = await api.get(`/api/exports/expenses?${params}`);
      const wb = buildExcelWorkbook([expensesToRows(data)]);
      downloadWorkbook(wb, "expenses-export");
      toast.success(`${data.length} expenses exported`);
    } catch {
      toast.error("Failed to export expenses");
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async (range?: DateRange) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (range?.from) params.set("from", range.from);
      if (range?.to) params.set("to", range.to);

      const { data } = await api.get(`/api/exports/expenses?${params}`);
      const total = data.reduce(
        (s: number, e: { amount: number }) => s + e.amount,
        0,
      );

      const doc = buildPDF({
        title: "Expenses Report",
        subtitle: `${data.length} entries · Total KES ${total.toLocaleString()}`,
        company: "POS System",
        sections: [
          {
            title: "Expenses",
            headers: ["Title", "Amount (KES)", "Category", "Date", "Logged By"],
            rows: data.map(
              (e: {
                title: string;
                amount: number;
                category?: { name: string } | null;
                date: string;
                user?: { name: string } | null;
              }) => [
                e.title,
                e.amount.toLocaleString(),
                e.category?.name ?? "—",
                format(new Date(e.date), "dd MMM yyyy"),
                e.user?.name ?? "—",
              ],
            ),
            colStyles: { 1: { halign: "right" } },
          },
        ],
      });
      downloadPDF(doc, "expenses-report");
    } catch {
      toast.error("Failed to export expenses PDF");
    } finally {
      setLoading(false);
    }
  };

  return { exportXLSX, exportPDF, loading };
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const useExportUsers = () => {
  const [loading, setLoading] = useState(false);

  const exportXLSX = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/exports/users");
      const wb = buildExcelWorkbook([usersToRows(data)]);
      downloadWorkbook(wb, "users-export");
      toast.success(`${data.length} users exported`);
    } catch {
      toast.error("Failed to export users");
    } finally {
      setLoading(false);
    }
  };

  return { exportXLSX, loading };
};

// ── Stock movement ────────────────────────────────────────────────────────────

export const useExportStock = () => {
  const [loading, setLoading] = useState(false);

  const exportXLSX = async (range?: DateRange) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (range?.from) params.set("from", range.from);
      if (range?.to) params.set("to", range.to);

      const { data } = await api.get(`/api/exports/stock?${params}`);
      const wb = buildExcelWorkbook([stockLogsToRows(data)]);
      downloadWorkbook(wb, "stock-movement-export");
      toast.success(`${data.length} stock movements exported`);
    } catch {
      toast.error("Failed to export stock movement");
    } finally {
      setLoading(false);
    }
  };

  return { exportXLSX, loading };
};

// ── Full JSON backup ──────────────────────────────────────────────────────────

export const useFullBackup = () => {
  const [loading, setLoading] = useState(false);

  const downloadBackup = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/exports/backup");
      if (!res.ok) throw new Error("Backup failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${format(new Date(), "yyyyMMdd-HHmm")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Full backup downloaded");
    } catch {
      toast.error("Backup failed");
    } finally {
      setLoading(false);
    }
  };

  return { downloadBackup, loading };
};
