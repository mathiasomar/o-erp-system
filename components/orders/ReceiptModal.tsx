// src/components/orders/ReceiptModal.tsx

"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Order } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { Receipt } from "./receipt";
import { useSystemSettings } from "../providers/SettingsProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  order: Order | null;
};

export function ReceiptModal({ open, onClose, order }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { settings } = useSystemSettings();
  const storeName = settings.campany_name ?? "My Store";

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: order ? `Receipt-${order.orderNumber}` : "Receipt",
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      @media print {
        html, body {
          width: 80mm;
          margin: 0;
          padding: 0;
          background: white;
        }
      }
    `,
  });

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Receipt — {order.orderNumber}</DialogTitle>
        </DialogHeader>

        {/* Scrollable preview */}
        <div className="overflow-y-auto max-h-[60vh] rounded-lg border bg-white">
          <Receipt ref={receiptRef} order={order} storeName={storeName} />
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            <X size={14} className="mr-1.5" /> Close
          </Button>
          <Button className="flex-1" onClick={() => handlePrint()}>
            <Printer size={14} className="mr-1.5" /> Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
