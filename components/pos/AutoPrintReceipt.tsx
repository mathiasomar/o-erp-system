"use client";

import { useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Order } from "@/types";
import { useSystemSettings } from "../providers/SettingsProvider";
import { Receipt } from "../orders/receipt";

type Props = {
  order: Order | null; // set this after a successful order
  onDone: () => void; // called after print completes or fails
};

export const AutoPrintReceipt = ({ order, onDone }: Props) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { settings } = useSystemSettings();
  const storeName = settings.receipt_store_name ?? "My Store";
  const hasPrinted = useRef(false);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: order ? `Receipt-${order.orderNumber}` : "Receipt",
    pageStyle: `
      @page { size: 80mm auto; margin: 0; }
      @media print {
        html, body { width: 80mm; margin: 0; padding: 0; background: white; }
      }
    `,
    onAfterPrint: onDone,
    onPrintError: () => onDone(), // fail silently, still call onDone
  });

  useEffect(() => {
    // Fire print automatically when a new order arrives
    if (order && !hasPrinted.current) {
      hasPrinted.current = true;
      // Small delay to let the Receipt render fully before printing
      const timer = setTimeout(() => {
        handlePrint();
      }, 300);
      return () => clearTimeout(timer);
    }
    if (!order) {
      hasPrinted.current = false;
    }
  }, [order, handlePrint]);

  if (!order) return null;

  // Render hidden — only used for printing
  return (
    <div className="hidden print:block">
      <Receipt ref={receiptRef} order={order} storeName={storeName} />
    </div>
  );
};
