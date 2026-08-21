import jsPDF from "jspdf";
import autoTable, { CellHookData } from "jspdf-autotable";
import { format } from "date-fns";
import { ReportData } from "@/types";

type RGB = [number, number, number];

type JsPDFInternal = typeof jsPDF.prototype.internal & {
  getNumberOfPages: () => number;
  getCurrentPageInfo: () => { pageNumber: number };
};

const HEADER_COLOR: RGB = [37, 99, 235]; // blue-600

const toNumber = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const formatCurrency = (value: number | null | undefined) =>
  `KES ${toNumber(value).toLocaleString()}`;

const formatPercent = (value: number | null | undefined) =>
  `${toNumber(value).toFixed(1)}%`;

const addPageFooter = (
  doc: jsPDF,
  internal: JsPDFInternal,
  pageW: number,
  pageH: number,
  company: string,
) => {
  const pageCount = internal.getNumberOfPages();
  const pageNum = internal.getCurrentPageInfo().pageNumber;
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Page ${pageNum} of ${pageCount}  ·  ${company} Report`,
    pageW / 2,
    pageH - 5,
    { align: "center" },
  );
};

export const exportReportPDF = (
  data: ReportData,
  range: string,
  company: string = "My Store",
) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const internal = doc.internal as JsPDFInternal;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const now = new Date();

  // ── Cover header ──────────────────────────────────────────────────────────
  doc.setFillColor(...HEADER_COLOR);
  doc.rect(0, 0, pageW, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(company, 12, 10);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Business Report — ${range.toUpperCase()}`, 12, 17);
  doc.setFontSize(8);
  doc.text(`Generated: ${format(now, "dd MMM yyyy, HH:mm")}`, pageW - 12, 17, {
    align: "right",
  });

  // ── Summary cards ─────────────────────────────────────────────────────────
  const cardY = 30;
  const cardH = 18;
  const cardW = (pageW - 24 - 25) / 6;
  const kpis = [
    {
      label: "Revenue",
      value: formatCurrency(data.summary?.totalRevenue),
      color: [220, 252, 231] as RGB,
    },
    {
      label: "COGS",
      value: formatCurrency(data.summary?.totalCostOfGoods),
      color: [255, 237, 213] as RGB,
    },
    {
      label: "Gross Profit",
      value: formatCurrency(data.summary?.totalGrossProfit),
      color: [245, 243, 255] as RGB,
    },
    {
      label: "Expenses",
      value: formatCurrency(data.summary?.totalExpenses),
      color: [254, 226, 226] as RGB,
    },
    {
      label: "Net Profit",
      value: formatCurrency(
        data.summary?.totalNetProfit ?? data.summary?.totalProfit,
      ),
      color: [219, 234, 254] as RGB,
    },
    {
      label: "Orders",
      value: String(toNumber(data.summary?.totalOrders)),
      color: [241, 245, 249] as RGB,
    },
  ];
  kpis.forEach((k, i) => {
    const x = 12 + i * (cardW + 5);
    doc.setFillColor(...k.color);
    doc.roundedRect(x, cardY, cardW, cardH, 2, 2, "F");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(k.label, x + 3, cardY + 6);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(k.value, x + 3, cardY + 13);
  });

  // ── Revenue trend table ───────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Revenue Trend", 12, 58);

  autoTable(doc, {
    startY: 62,
    margin: { left: 12, right: 12 },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: HEADER_COLOR, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    head: [
      [
        "Date",
        "Revenue",
        "COGS",
        "Gross Profit",
        "Expenses",
        "Net Profit",
        "Gross Margin",
        "Net Margin",
        "Orders",
      ],
    ],
    body: (data.trendData ?? []).map((r) => [
      r.date,
      formatCurrency(r.revenue),
      formatCurrency(r.costOfGoods),
      formatCurrency(r.grossProfit),
      formatCurrency(r.expenses),
      formatCurrency(r.netProfit ?? r.profit),
      formatPercent(r.grossMargin),
      formatPercent(r.profitMargin),
      r.orders,
    ]),
    didDrawPage: () => addPageFooter(doc, internal, pageW, pageH, company),
  });

  // ── Top products ──────────────────────────────────────────────────────────
  doc.addPage();
  doc.setFillColor(...HEADER_COLOR);
  doc.rect(0, 0, pageW, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Top Products", 12, 9);

  autoTable(doc, {
    startY: 18,
    margin: { left: 12, right: 12 },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: HEADER_COLOR, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    head: [["#", "Product", "Category", "Units Sold", "Revenue (KES)"]],
    body: (data.topProducts ?? []).map((p, i) => [
      i + 1,
      p.name,
      p.category,
      p.units,
      formatCurrency(p.revenue),
    ]),
    didDrawPage: () => addPageFooter(doc, internal, pageW, pageH, company),
  });

  // ── Stock movement ────────────────────────────────────────────────────────
  const afterProducts =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Recent Stock Movement", 12, afterProducts);

  autoTable(doc, {
    startY: afterProducts + 4,
    margin: { left: 12, right: 12 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: HEADER_COLOR, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    head: [["Product", "Reason", "Change", "Before", "After", "Date"]],
    body: (data.stockMovement ?? [])
      .slice(0, 20)
      .map((s) => [
        s.product,
        s.reason,
        s.change > 0 ? `+${s.change}` : s.change,
        s.before,
        s.after,
        s.date,
      ]),
    didParseCell: (d: CellHookData) => {
      if (d.column.index === 2 && d.section === "body") {
        const val = String(d.cell.raw);
        d.cell.styles.textColor = val.startsWith("+")
          ? [22, 163, 74]
          : [220, 38, 38];
        d.cell.styles.fontStyle = "bold";
      }
    },
    didDrawPage: () => addPageFooter(doc, internal, pageW, pageH, company),
  });

  // ── Cashier performance + payment breakdown ───────────────────────────────
  doc.addPage();
  doc.setFillColor(...HEADER_COLOR);
  doc.rect(0, 0, pageW, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Cashier Performance", 12, 9);

  autoTable(doc, {
    startY: 18,
    margin: { left: 12, right: pageW / 2 + 6 },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: HEADER_COLOR, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    head: [["Cashier", "Orders", "Revenue (KES)"]],
    body: (data.cashierPerformance ?? []).map((c) => [
      c.name,
      c.orders,
      formatCurrency(c.revenue),
    ]),
    didDrawPage: () => addPageFooter(doc, internal, pageW, pageH, company),
  });

  const midX = pageW / 2 + 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Payment Breakdown", midX, 9);

  autoTable(doc, {
    startY: 18,
    margin: { left: midX, right: 12 },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: HEADER_COLOR, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    head: [["Method", "Transactions", "Amount (KES)"]],
    body: Object.entries(data.paymentBreakdown ?? {}).map(([m, v]) => [
      m,
      v.count,
      formatCurrency(v.amount),
    ]),
    didDrawPage: () => addPageFooter(doc, internal, pageW, pageH, company),
  });

  const fileName = `report-${range}-${format(now, "yyyyMMdd")}.pdf`;
  doc.save(fileName);
};
