import * as XLSX from "xlsx";
import { ReportData } from "@/types";
import { format } from "date-fns";

export const exportReportCSV = (data: ReportData, range: string) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1 — Summary
  const summaryRows = [
    ["Metric", "Value"],
    [
      "Total Revenue",
      `KES ${Number(data.summary?.totalRevenue ?? 0).toLocaleString()}`,
    ],
    [
      "Total Expenses",
      `KES ${Number(data.summary?.totalExpenses ?? 0).toLocaleString()}`,
    ],
    [
      "Net Profit",
      `KES ${Number(data.summary?.totalNetProfit ?? data.summary?.totalProfit ?? 0).toLocaleString()}`,
    ],
    ["Total Orders", data.summary?.totalOrders ?? 0],
    ["Cancelled Orders", data.summary?.cancelledOrders ?? 0],
    [
      "Avg Order Value",
      `KES ${Number(data.summary?.avgOrderValue ?? 0).toFixed(2)}`,
    ],
    ["Out of Stock", data.summary?.outOfStock ?? 0],
    ["Low Stock Items", data.summary?.lowStock ?? 0],
    [
      "Total Stock Value",
      `KES ${Number(data.summary?.stockValue ?? 0).toLocaleString()}`,
    ],
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(summaryRows),
    "Summary",
  );

  // Sheet 2 — Revenue Trend
  const trendRows = [
    ["Date", "Revenue (KES)", "Expenses (KES)", "Profit (KES)", "Orders"],
    ...(data.trendData ?? []).map((r) => [
      r.date,
      r.revenue,
      r.expenses,
      r.profit,
      r.orders,
    ]),
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(trendRows),
    "Revenue Trend",
  );

  // Sheet 3 — Top Products
  const productRows = [
    ["Product", "Category", "Units Sold", "Revenue (KES)"],
    ...(data.topProducts ?? []).map((p) => [
      p.name,
      p.category,
      p.units,
      p.revenue,
    ]),
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(productRows),
    "Top Products",
  );

  // Sheet 4 — Expenses by Category
  const expRows = [
    ["Category", "Amount (KES)"],
    ...Object.entries(data.expenseByCategory ?? {}).map(([k, v]) => [k, v]),
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(expRows),
    "Expenses",
  );

  // Sheet 5 — Stock Movement
  const stockRows = [
    ["Product", "Reason", "Change", "Before", "After", "Note", "Date"],
    ...(data.stockMovement ?? []).map((s) => [
      s.product,
      s.reason,
      s.change,
      s.before,
      s.after,
      s.note ?? "",
      s.date,
    ]),
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(stockRows),
    "Stock Movement",
  );

  // Sheet 6 — Cashier Performance
  const cashierRows = [
    ["Cashier", "Orders", "Revenue (KES)"],
    ...(data.cashierPerformance ?? []).map((c) => [
      c.name,
      c.orders,
      c.revenue,
    ]),
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(cashierRows),
    "Cashier Performance",
  );

  const fileName = `report-${range}-${format(new Date(), "yyyyMMdd")}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
