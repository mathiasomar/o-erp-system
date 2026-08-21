// src/components/payments/columns.tsx

"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PaymentWithOrder, SplitPayment } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  ArrowUpDown,
  Eye,
  Banknote,
  Smartphone,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

// ── Shared config ─────────────────────────────────────────────────────────────

const methodConfig: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
  }
> = {
  CASH: {
    label: "Cash",
    icon: Banknote,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/20",
  },
  MPESA: {
    label: "M-Pesa",
    icon: Smartphone,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/20",
  },
  CARD: {
    label: "Card",
    icon: CreditCard,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950/20",
  },
};

const orderStatusConfig = {
  COMPLETED: {
    variant: "default" as const,
    icon: CheckCircle2,
    color: "text-green-600",
  },
  CANCELLED: {
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-destructive",
  },
  PENDING: {
    variant: "secondary" as const,
    icon: Clock,
    color: "text-muted-foreground",
  },
};

// ── Helper: derive primary method from splitPayments ─────────────────────────
// Primary = the split line with the largest amount

const primarySplit = (splits: SplitPayment[]): SplitPayment | null =>
  splits.length === 0
    ? null
    : [...splits].sort((a, b) => b.amount - a.amount)[0];

// ── DetailRow ─────────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between py-2
                    text-sm border-b last:border-0"
    >
      <span className="text-muted-foreground">{label}</span>
      <div className="font-medium text-right">{value}</div>
    </div>
  );
}

// ── SplitPaymentLine — renders one payment line in the dialog ─────────────────

function SplitPaymentLine({
  sp,
  index,
  total,
}: {
  sp: SplitPayment;
  index: number;
  total: number;
}) {
  const mc = methodConfig[sp.method];
  const Icon = mc?.icon;

  return (
    <div className="rounded-lg border px-3 space-y-0">
      {total > 1 && (
        <p className="text-[10px] text-muted-foreground pt-2 pb-0.5">
          Line {index + 1}
        </p>
      )}
      <DetailRow
        label="Method"
        value={
          <span className={`flex items-center gap-1.5 ${mc?.color}`}>
            {Icon && <Icon size={13} />}
            {mc?.label ?? sp.method}
          </span>
        }
      />
      <DetailRow
        label="Amount"
        value={
          <span className="font-bold">KES {sp.amount.toLocaleString()}</span>
        }
      />
      {sp.mpesaRef && (
        <DetailRow
          label="M-Pesa reference"
          value={
            <span
              className="font-mono text-xs bg-muted
                             px-2 py-0.5 rounded font-semibold"
            >
              {sp.mpesaRef}
            </span>
          }
        />
      )}
      {sp.mpesaPhone && (
        <DetailRow
          label="M-Pesa phone"
          value={<span className="font-mono text-xs">{sp.mpesaPhone}</span>}
        />
      )}
    </div>
  );
}

// ── PaymentDetailDialog ───────────────────────────────────────────────────────

function PaymentDetailDialog({
  payment,
  open,
  onClose,
}: {
  payment: PaymentWithOrder;
  open: boolean;
  onClose: () => void;
}) {
  const splits = payment.splitPayments ?? [];
  const primary = primarySplit(splits);
  const mc = primary ? methodConfig[primary.method] : null;
  const MethodIcon = mc?.icon;

  const sc =
    orderStatusConfig[payment.order.status as keyof typeof orderStatusConfig] ??
    orderStatusConfig.PENDING;
  const StatusIcon = sc.icon;

  const totalItems = payment.order.items.reduce((s, i) => s + i.quantity, 0);
  const isSplit = splits.length > 1;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {MethodIcon && mc && <MethodIcon size={16} className={mc.color} />}
            Payment Details
            {isSplit && (
              <Badge variant="outline" className="text-[10px] ml-1">
                Split × {splits.length}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Transaction for order{" "}
            <span className="font-mono font-medium text-foreground">
              {payment.order.orderNumber}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ── Payment lines ──────────────────────────────────────────────── */}
          <div>
            <p
              className="text-xs font-medium text-muted-foreground
                          uppercase tracking-wide mb-2"
            >
              {isSplit ? `Payment (${splits.length} methods)` : "Payment"}
            </p>
            <div className="space-y-2">
              {splits.map((sp, i) => (
                <SplitPaymentLine
                  key={sp.id}
                  sp={sp}
                  index={i}
                  total={splits.length}
                />
              ))}
            </div>

            {/* Total paid summary */}
            <div className="rounded-lg border px-3 mt-2">
              <DetailRow
                label="Order total"
                value={`KES ${payment.order.total.toLocaleString()}`}
              />
              <DetailRow
                label="Total paid"
                value={
                  <span className="font-bold">
                    KES {payment.amount.toLocaleString()}
                  </span>
                }
              />
              <DetailRow
                label="Payment date"
                value={format(
                  new Date(payment.createdAt),
                  "dd MMM yyyy, HH:mm:ss",
                )}
              />
            </div>
          </div>

          {/* ── Order info ─────────────────────────────────────────────────── */}
          <div>
            <p
              className="text-xs font-medium text-muted-foreground
                          uppercase tracking-wide mb-2"
            >
              Order
            </p>
            <div className="rounded-lg border px-3">
              <DetailRow
                label="Order number"
                value={
                  <span
                    className="font-mono text-xs bg-muted
                                   px-2 py-0.5 rounded"
                  >
                    {payment.order.orderNumber}
                  </span>
                }
              />
              <DetailRow
                label="Status"
                value={
                  <Badge variant={sc.variant} className="gap-1">
                    <StatusIcon size={11} />
                    {payment.order.status}
                  </Badge>
                }
              />
              <DetailRow
                label="Items"
                value={`${totalItems} unit${totalItems !== 1 ? "s" : ""}`}
              />
              <DetailRow
                label="Order total"
                value={`KES ${payment.order.total.toLocaleString()}`}
              />
            </div>
          </div>
        </div>

        <Separator />
        <Button variant="outline" className="w-full" onClick={onClose}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ── Columns ───────────────────────────────────────────────────────────────────

export const paymentColumns: ColumnDef<PaymentWithOrder>[] = [
  // ── Method column — shows primary or split badges ─────────────────────────
  {
    id: "method",
    header: "Method",
    cell: ({ row }) => {
      const splits = row.original.splitPayments ?? [];
      const primary = primarySplit(splits);

      if (!primary) {
        return <span className="text-muted-foreground text-xs">—</span>;
      }

      if (splits.length === 1) {
        const mc = methodConfig[primary.method];
        const Icon = mc?.icon;
        return (
          <div
            className={`flex items-center gap-1.5 text-sm
                           font-medium ${mc?.color}`}
          >
            {Icon && <Icon size={14} />}
            {mc?.label ?? primary.method}
          </div>
        );
      }

      // Split payment — show small badges for each method
      return (
        <div className="flex flex-wrap gap-1">
          {splits.map((sp, i) => {
            const mc = methodConfig[sp.method];
            const Icon = mc?.icon;
            return (
              <span
                key={i}
                className={`inline-flex items-center gap-0.5 text-[10px]
                             font-medium px-1.5 py-0.5 rounded-md
                             ${mc?.bg ?? "bg-muted"} ${mc?.color ?? ""}`}
              >
                {Icon && <Icon size={9} />}
                {mc?.label ?? sp.method}
              </span>
            );
          })}
        </div>
      );
    },
  },

  // ── Order number ──────────────────────────────────────────────────────────
  {
    accessorKey: "order.orderNumber",
    header: "Order",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-medium">
        {row.original.order.orderNumber}
      </span>
    ),
  },

  // ── Order status ──────────────────────────────────────────────────────────
  {
    accessorKey: "order.status",
    header: "Status",
    cell: ({ row }) => {
      const sc =
        orderStatusConfig[
          row.original.order.status as keyof typeof orderStatusConfig
        ] ?? orderStatusConfig.PENDING;
      const Icon = sc.icon;
      return (
        <Badge variant={sc.variant} className="gap-1">
          <Icon size={11} />
          {row.original.order.status}
        </Badge>
      );
    },
  },

  // ── Total amount ──────────────────────────────────────────────────────────
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Amount <ArrowUpDown size={14} className="ml-1" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-semibold">
        KES {row.original.amount.toLocaleString()}
      </span>
    ),
  },

  // ── M-Pesa ref — shows first mpesaRef found in splitPayments ─────────────
  {
    id: "mpesaRef",
    header: "M-Pesa ref",
    cell: ({ row }) => {
      const mpesaLine = row.original.splitPayments?.find(
        (sp) => sp.method === "MPESA" && sp.mpesaRef,
      );
      return mpesaLine?.mpesaRef ? (
        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
          {mpesaLine.mpesaRef}
        </span>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      );
    },
  },

  // ── M-Pesa phone ──────────────────────────────────────────────────────────
  {
    id: "mpesaPhone",
    header: "Phone",
    cell: ({ row }) => {
      const mpesaLine = row.original.splitPayments?.find(
        (sp) => sp.method === "MPESA" && sp.mpesaPhone,
      );
      return (
        <span className="text-sm text-muted-foreground">
          {mpesaLine?.mpesaPhone ?? "—"}
        </span>
      );
    },
  },

  // ── Items ─────────────────────────────────────────────────────────────────
  {
    accessorKey: "order.items",
    header: "Items",
    cell: ({ row }) => {
      const total = row.original.order.items.reduce(
        (s, i) => s + i.quantity,
        0,
      );
      return (
        <span className="text-sm text-muted-foreground">
          {total} unit{total !== 1 ? "s" : ""}
        </span>
      );
    },
  },

  // ── Date ──────────────────────────────────────────────────────────────────
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date <ArrowUpDown size={14} className="ml-1" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {format(new Date(row.original.createdAt), "dd MMM yyyy, HH:mm")}
      </span>
    ),
  },

  // ── Eye action ────────────────────────────────────────────────────────────
  {
    id: "actions",
    cell: ({ row }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="View payment details"
            onClick={() => setOpen(true)}
          >
            <Eye size={14} />
          </Button>
          <PaymentDetailDialog
            payment={row.original}
            open={open}
            onClose={() => setOpen(false)}
          />
        </>
      );
    },
  },
];
