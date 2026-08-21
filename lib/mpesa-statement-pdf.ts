import jsPDF from "jspdf";
import autoTable, { CellHookData } from "jspdf-autotable";
import { format } from "date-fns";
import { MpesaTransaction } from "@/types";

// ── Extend jsPDF internal type to expose page methods ────────────────────────

type JsPDFInternal = typeof jsPDF.prototype.internal & {
  getNumberOfPages: () => number;
  getCurrentPageInfo: () => { pageNumber: number };
};

// ── Types ─────────────────────────────────────────────────────────────────────

type RGB = [number, number, number];

type StatementOptions = {
  transactions: MpesaTransaction[];
  filters: {
    status?: string;
    from?: string;
    to?: string;
    search?: string;
  };
  storeName?: string;
  branchName?: string;
};

type SummaryCard = {
  label: string;
  value: string;
  color: RGB;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, RGB> = {
  SUCCESS: [22, 163, 74],
  PENDING: [100, 116, 139],
  FAILED: [220, 38, 38],
};

// ── Generator ─────────────────────────────────────────────────────────────────

export function generateMpesaStatementPDF({
  transactions,
  filters,
  storeName = "My Store",
  branchName = "MAIN BRANCH",
}: StatementOptions): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const internal = doc.internal as JsPDFInternal;

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const now = new Date();
  const genDate = format(now, "dd MMM yyyy, HH:mm");

  // ── Summary counts ──────────────────────────────────────────────────────
  const successTx = transactions.filter((t) => t.status === "SUCCESS");
  const pendingTx = transactions.filter((t) => t.status === "PENDING");
  const failedTx = transactions.filter((t) => t.status === "FAILED");
  const totalAmount = successTx.reduce((s, t) => s + t.amount, 0);

  // ── Header bar ──────────────────────────────────────────────────────────
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageW, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(storeName, 12, 10);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(branchName, 100, 16);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("M-Pesa Transaction Statement", 12, 16);

  doc.setFontSize(8);
  doc.text(`Generated: ${genDate}`, pageW - 12, 10, { align: "right" });

  // ── Filter summary ──────────────────────────────────────────────────────
  const filterParts: string[] = [];
  if (filters.status && filters.status !== "ALL")
    filterParts.push(`Status: ${filters.status}`);
  if (filters.from)
    filterParts.push(`From: ${format(new Date(filters.from), "dd MMM yyyy")}`);
  if (filters.to)
    filterParts.push(`To: ${format(new Date(filters.to), "dd MMM yyyy")}`);
  if (filters.search) filterParts.push(`Search: "${filters.search}"`);

  if (filterParts.length > 0) {
    doc.text(`Filters applied: ${filterParts.join("  ·  ")}`, pageW - 12, 16, {
      align: "right",
    });
  }

  // ── Summary cards ───────────────────────────────────────────────────────
  const cardY = 28;
  const cardH = 18;
  const cardW = (pageW - 24 - 12) / 4;

  const cards: SummaryCard[] = [
    {
      label: "Total transactions",
      value: String(transactions.length),
      color: [241, 245, 249],
    },
    {
      label: "Successful",
      value: String(successTx.length),
      color: [220, 252, 231],
    },
    {
      label: "Failed / Pending",
      value: String(failedTx.length + pendingTx.length),
      color: [254, 226, 226],
    },
    {
      label: "Total received",
      value: `KES ${totalAmount.toLocaleString()}`,
      color: [219, 234, 254],
    },
  ];

  cards.forEach((card, i) => {
    const x = 12 + i * (cardW + 4);
    doc.setFillColor(...card.color);
    doc.roundedRect(x, cardY, cardW, cardH, 2, 2, "F");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(card.label, x + 3, cardY + 6);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(card.value, x + 3, cardY + 13);
  });

  // ── Table ───────────────────────────────────────────────────────────────
  const tableStartY = cardY + cardH + 6;

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: 12, right: 12 },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      overflow: "linebreak",
      font: "helvetica",
    },
    headStyles: {
      fillColor: [16, 185, 129] as RGB,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] as RGB,
    },
    columnStyles: {
      0: { cellWidth: 30 }, // Status
      1: { cellWidth: 45 }, // Receipt no
      2: { cellWidth: 50 }, // Phone
      3: { cellWidth: 35 }, // Amount
      4: { cellWidth: 60 }, // Result
      5: { cellWidth: 57 }, // Date
    },
    head: [
      ["Status", "Receipt no.", "Phone", "Amount (KES)", "Result", "Date"],
    ],
    body: transactions.map((t) => [
      t.status,
      t.mpesaReceiptNumber ?? "—",
      t.phoneNumber,
      t.amount.toLocaleString(),
      t.resultDesc ?? "—",
      format(new Date(t.createdAt), "dd MMM yy HH:mm"),
    ]),

    didParseCell: (data: CellHookData) => {
      if (data.column.index === 0 && data.section === "body") {
        const status = String(data.cell.raw);
        const color = STATUS_COLORS[status];
        if (color) {
          data.cell.styles.textColor = color;
          data.cell.styles.fontStyle = "bold";
        }
      }
    },

    didDrawPage: () => {
      const pageCount = internal.getNumberOfPages();
      const pageNum = internal.getCurrentPageInfo().pageNumber;

      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Page ${pageNum} of ${pageCount}  ·  ${storeName} M-Pesa Statement`,
        pageW / 2,
        pageH - 5,
        { align: "center" },
      );
    },
  });

  // ── Save ────────────────────────────────────────────────────────────────
  const fileName = `mpesa-statement-${format(now, "yyyyMMdd-HHmm")}.pdf`;
  doc.save(fileName);
}
