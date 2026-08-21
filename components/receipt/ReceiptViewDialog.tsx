"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Receipt } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, X, User, Calendar, CreditCard, Package } from "lucide-react";
import { format } from "date-fns";
import { Receipt as ReceiptComponent } from "../orders/receipt";
import { useOrder } from "@/hooks/use-orders";

const statusBadgeVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  COMPLETED: "default",
  PENDING: "secondary",
  CANCELLED: "destructive",
  VOIDED: "destructive",
};

type Props = {
  open: boolean;
  onClose: () => void;
  receipt: Receipt;
};

const methodLabel: Record<string, string> = {
  CASH: "Cash",
  MPESA: "M-Pesa",
  CARD: "Card",
};

export const ReceiptViewDialog = ({ open, onClose, receipt }: Props) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const { data: order } = useOrder(receipt.orderId as string);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: order ? `Receipt-${receipt.receiptNumber}` : "Receipt",
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
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh]
                                flex flex-col gap-0 p-0"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="font-mono">{receipt.receiptNumber}</span>
              <Badge
                variant={statusBadgeVariant[order.status] ?? "secondary"}
                className="text-xs"
              >
                {order.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>
        </div>

        <Separator />

        {/* Body — two columns */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y
                          md:divide-y-0 md:divide-x"
          >
            {/* Left — receipt preview */}
            <div className="p-6 flex flex-col items-center">
              <p className="text-xs text-muted-foreground mb-3 self-start">
                Receipt preview
              </p>
              <div
                className="rounded-lg border bg-white overflow-y-auto
                              max-h-96 w-full"
              >
                <ReceiptComponent
                  ref={receiptRef}
                  order={order}
                  receipt={receipt}
                />
              </div>
            </div>

            {/* Right — order details */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground">Order details</p>

              {/* Cashier */}
              <div
                className="flex items-start gap-3 p-3 rounded-lg
                              border bg-muted/40"
              >
                <div className="p-2 rounded-lg bg-background">
                  <User size={14} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Served by</p>
                  <p className="text-sm font-medium">
                    {order.user?.name ?? "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.user?.email ?? "—"}
                  </p>
                  {order.user?.role && (
                    <Badge variant="outline" className="text-[10px] mt-1">
                      {order.user.role.toLowerCase()}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Date */}
              <div
                className="flex items-start gap-3 p-3 rounded-lg
                              border bg-muted/40"
              >
                <div className="p-2 rounded-lg bg-background">
                  <Calendar size={14} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date & time</p>
                  <p className="text-sm font-medium">
                    {format(new Date(order.createdAt), "dd MMM yyyy")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(order.createdAt), "HH:mm:ss")}
                  </p>
                </div>
              </div>

              {/* Items summary */}
              <div
                className="flex items-start gap-3 p-3 rounded-lg
                              border bg-muted/40"
              >
                <div className="p-2 rounded-lg bg-background">
                  <Package size={14} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Items</p>
                  <div className="space-y-0.5">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-xs gap-2"
                      >
                        <span className="truncate text-muted-foreground">
                          {item.productName} × {item.quantity}
                        </span>
                        <span className="shrink-0 font-medium">
                          KES {item.total.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-sm font-bold">
                    <span>Total</span>
                    <span>KES {order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment */}
              {order.payment && (
                <div
                  className="flex items-start gap-3 p-3 rounded-lg
                                border bg-muted/40"
                >
                  <div className="p-2 rounded-lg bg-background">
                    <CreditCard size={14} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Payment</p>
                    <div className="flex flex-col space-y-2">
                      {order.payment.splitPayments &&
                        order.payment.splitPayments.map((p, index) => (
                          <div key={index}>
                            <p className="text-sm font-medium">
                              {methodLabel[p.method]}
                            </p>
                            {p.mpesaRef && (
                              <p
                                className="text-xs font-mono bg-muted
                                    px-1.5 py-0.5 rounded mt-1"
                              >
                                {p.mpesaRef}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      KES {order.payment.amount.toLocaleString()} paid
                    </p>
                    {order.payment.amount > order.total && (
                      <p className="text-xs text-green-600 font-medium">
                        Change: KES{" "}
                        {(order.payment.amount - order.total).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Footer */}
        <div className="px-6 py-4 shrink-0 flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            <X size={14} className="mr-1.5" /> Close
          </Button>
          <Button onClick={() => handlePrint()}>
            <Printer size={14} className="mr-1.5" /> Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
