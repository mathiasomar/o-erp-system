import jsPDF from "jspdf";
import autoTable, { CellHookData } from "jspdf-autotable";
import { format } from "date-fns";

type RGB = [number, number, number];

const BLUE: RGB = [37, 99, 235];
const GRAY: RGB = [248, 250, 252];
const DARK: RGB = [30, 41, 59];

type JsPDFWithAutoTable = jsPDF & {
  lastAutoTable: { finalY: number };
};

type PDFSection = {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  colStyles?: Record<
    number,
    { cellWidth?: number; halign?: "left" | "right" | "center" }
  >;
};

export const buildPDF = ({
  title,
  subtitle,
  company,
  sections,
}: {
  title: string;
  subtitle: string;
  company: string;
  sections: PDFSection[];
}): jsPDF => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let isFirst = true;

  const addFooter = () => {
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `${company}  ·  ${title}  ·  Page ${i} of ${pages}  ·  ${format(new Date(), "dd MMM yyyy HH:mm")}`,
        pageW / 2,
        pageH - 4,
        { align: "center" },
      );
    }
  };

  sections.forEach((section) => {
    if (!isFirst) doc.addPage();
    isFirst = false;

    // Section header bar
    doc.setFillColor(...BLUE);
    doc.rect(0, 0, pageW, 18, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(section.title, 12, 11);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, pageW - 12, 11, { align: "right" });

    autoTable(doc, {
      startY: 24,
      margin: { left: 12, right: 12 },
      head: [section.headers],
      body: section.rows,
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      headStyles: { fillColor: BLUE, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: GRAY },
      columnStyles: section.colStyles ?? {},
      didDrawPage: () => {},
    });
  });

  addFooter();
  return doc;
};

export const downloadPDF = (doc: jsPDF, filename: string) => {
  doc.save(`${filename}-${format(new Date(), "yyyyMMdd-HHmm")}.pdf`);
};
