// src/components/orders/Receipt.tsx

"use client";

import { forwardRef } from "react";
import { Order } from "@/types";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useSystemSettings } from "../providers/SettingsProvider";

// ── Receipt model type (from the new Receipt table) ───────────────────────────
// Optional — if passed, receipt data takes priority over order data

type ReceiptData = {
  receiptNumber: string;
  type: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  note: string | null;
  printCount: number;
  createdAt: string;
  voidedAt: string | null;
  voidReason: string | null;
  voidedBy?: { name: string } | null;
  parentReceipt?: { receiptNumber: string } | null;
  originalReceipt?: { receiptNumber: string } | null;
  items: {
    id?: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
};

type Props = {
  order: Order;
  receipt?: ReceiptData; // if provided, receipt data is shown instead of order data
  storeName?: string;
};

export const Receipt = forwardRef<HTMLDivElement, Props>(
  ({ order, receipt }, ref) => {
    const { settings } = useSystemSettings();

    const methodLabel: Record<string, string> = {
      CASH: "Cash",
      MPESA: "M-Pesa",
      CARD: "Card",
    };

    // ── Use receipt data when available, fall back to order ───────────────────
    const receiptNumber = receipt?.receiptNumber ?? order.orderNumber;
    const status = receipt?.status ?? order.status;
    const subtotal = receipt?.subtotal ?? order.subtotal;
    const discount = receipt?.discount ?? order.discount;
    const tax = receipt?.tax ?? order.tax;
    const total = receipt?.total ?? order.total;
    const note = receipt?.note ?? order.note;
    const createdAt = receipt?.createdAt ?? order.createdAt;
    const items = receipt?.items ?? order.items;

    // ── Status badge variant ──────────────────────────────────────────────────
    const statusVariant = (s: string) => {
      if (s === "COMPLETED" || s === "ACTIVE") return "default";
      if (s === "CANCELLED" || s === "VOIDED") return "destructive";
      if (s === "COMBINED") return "secondary";
      return "outline";
    };

    // ── Cash payment details ──────────────────────────────────────────────────
    const splitPayments = order.payment?.splitPayments ?? [];
    const cashPayment = splitPayments.find((sp) => sp.method === "CASH");
    const totalPaid = splitPayments.reduce((s, sp) => s + sp.amount, 0);
    const change = cashPayment ? Math.max(0, totalPaid - total) : 0;

    return (
      <div
        ref={ref}
        className="bg-white text-black font-mono text-xs
                   w-72 mx-auto p-4 space-y-3"
      >
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="text-center space-y-0.5">
          <p className="font-bold text-sm uppercase">{settings.company_name}</p>
          <p className="text-[10px] uppercase">Sales Receipt</p>
          <p className="text-[10px]">
            {format(new Date(createdAt), "dd MMM yyyy, HH:mm")}
          </p>
          {settings.company_phone && (
            <p className="text-[12px]">{settings.company_phone}</p>
          )}
          {settings.company_email && (
            <p className="text-[12px]">{settings.company_email}</p>
          )}
          <p className="font-bold text-sm">
            {settings.company_paybill
              ? `MPESA PAYBILL: ${settings.company_paybill}`
              : `MPESA TILL: ${settings.company_till}`}
          </p>
          {settings.company_account_number && (
            <p className="font-bold text-sm">
              ACCOUNT NO: {settings.company_account_number}
            </p>
          )}
        </div>

        <Separator className="border-dashed border-gray-300" />

        {/* ── Receipt / order number + status ──────────────────────────── */}
        <div className="flex justify-between items-center">
          <div>
            <span className="font-semibold">{receiptNumber}</span>
            {/* Show receipt number separately when different from order number */}
            {receipt && order.orderNumber !== receipt.receiptNumber && (
              <p className="text-[10px] text-gray-500">
                Order: {order.orderNumber}
              </p>
            )}
          </div>
          <Badge variant={statusVariant(status)} className="text-[10px]">
            {status}
          </Badge>
        </div>

        {/* Receipt type badge — only show for non-sale types */}
        {receipt && receipt.type !== "SALE" && (
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500">Type</span>
            <Badge variant="outline" className="text-[10px]">
              {receipt.type}
            </Badge>
          </div>
        )}

        {/* Print count — only show if reprinted */}
        {receipt && receipt.printCount > 1 && (
          <p className="text-center text-[10px] font-bold text-gray-500">
            *** COPY — PRINT #{receipt.printCount} ***
          </p>
        )}

        {/* Source receipt reference for duplicates */}
        {receipt?.originalReceipt && (
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500">Reprint of</span>
            <span className="font-mono">
              {receipt.originalReceipt.receiptNumber}
            </span>
          </div>
        )}

        {/* Combined receipt source reference */}
        {receipt?.parentReceipt && (
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500">Combined into</span>
            <span className="font-mono">
              {receipt.parentReceipt.receiptNumber}
            </span>
          </div>
        )}

        {/* Void notice */}
        {status === "VOIDED" && (
          <div className="border border-red-400 rounded p-2 text-center">
            <p className="font-bold text-red-600 text-[11px] uppercase">
              *** VOIDED RECEIPT ***
            </p>
            {receipt?.voidedAt && (
              <p className="text-[10px] text-red-500">
                {format(new Date(receipt.voidedAt), "dd MMM yyyy, HH:mm")}
              </p>
            )}
            {receipt?.voidedBy && (
              <p className="text-[10px] text-red-500">
                By: {receipt.voidedBy.name}
              </p>
            )}
            {receipt?.voidReason && (
              <p className="text-[10px] text-red-500 mt-0.5">
                Reason: {receipt.voidReason}
              </p>
            )}
          </div>
        )}

        {/* Served by */}
        {order.user && (
          <div className="flex justify-between text-[10px]">
            <span>Served by</span>
            <span className="font-medium">{order.user.name}</span>
          </div>
        )}

        <Separator className="border-dashed border-gray-900" />

        {/* ── Items ────────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={item.id ?? i} className="flex justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{item.productName}</p>
                <p>
                  {item.quantity} × KES {item.unitPrice.toLocaleString()}
                </p>
              </div>
              <span className="shrink-0 font-medium">
                KES {item.total.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <Separator className="border-dashed border-gray-900" />

        {/* ── Totals ───────────────────────────────────────────────────── */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>KES {subtotal.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Discount</span>
              <span>− KES {discount.toLocaleString()}</span>
            </div>
          )}
          {tax > 0 && (
            <div className="flex justify-between">
              <span>Tax</span>
              <span>KES {tax.toLocaleString()}</span>
            </div>
          )}
          <div
            className="flex justify-between font-bold text-sm pt-1
                          border-t border-dashed border-gray-800"
          >
            <span>Total</span>
            <span>KES {total.toLocaleString()}</span>
          </div>
        </div>

        {/* ── Payment ──────────────────────────────────────────────────── */}
        {splitPayments.length > 0 && (
          <>
            <Separator className="border-dashed border-gray-800" />
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wide">Payment</p>
              {splitPayments.map((sp, i) => (
                <div key={sp.id ?? i} className="space-y-0.5">
                  <div className="flex justify-between">
                    <span>{methodLabel[sp.method] ?? sp.method}</span>
                    <span className="font-medium">
                      KES {sp.amount.toLocaleString()}
                    </span>
                  </div>
                  {sp.mpesaRef && (
                    <div className="flex justify-between text-[10px]">
                      <span>Ref</span>
                      <span className="font-mono">{sp.mpesaRef}</span>
                    </div>
                  )}
                  {sp.mpesaPhone && (
                    <div className="flex justify-between text-[10px]">
                      <span>Phone</span>
                      <span>{sp.mpesaPhone}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Tendered + change — only show for cash transactions */}
            {cashPayment && (
              <div className="space-y-1">
                <div
                  className="flex justify-between font-bold text-sm pt-1
                                border-t border-dashed border-gray-800"
                >
                  <span>Tendered</span>
                  <span>KES {totalPaid.toLocaleString()}</span>
                </div>
                {change > 0 && (
                  <>
                    <Separator className="border-dashed border-gray-300" />
                    <div className="flex justify-between">
                      <span className="text-gray-500">Change</span>
                      <span>KES {change.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Customer ─────────────────────────────────────────────────── */}
        {order.customer && (
          <>
            <Separator className="border-dashed border-gray-300" />
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wide">Customer</p>
              <div className="flex justify-between">
                <span>Name</span>
                <span className="font-medium">{order.customer.name}</span>
              </div>
              {order.customer.phone && (
                <div className="flex justify-between">
                  <span>Phone</span>
                  <span className="font-medium">{order.customer.phone}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Note ─────────────────────────────────────────────────────── */}
        {note && (
          <>
            <Separator className="border-dashed border-gray-300" />
            <p className="text-[10px]">Note: {note}</p>
          </>
        )}

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <Separator className="border-dashed border-gray-900" />
        <div className="space-y-1">
          <p className="text-center text-[10px]">
            Thank you for being our valued customer!
          </p>
          <p className="text-center font-bold italic mb-4 uppercase">
            welcome again
          </p>
          <p className="text-center text-[10px]">
            POS developed by Omar Mathias
          </p>
          <p className="text-center text-[10px]">+254114625336</p>
        </div>
      </div>
    );
  },
);

Receipt.displayName = "Receipt";
