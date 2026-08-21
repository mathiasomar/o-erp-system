"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Printer,
  XCircle,
  Package,
  CreditCard,
  Hash,
  Info,
  Clock,
  CheckCircle2,
  Ban,
  Smartphone,
  Banknote,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useCancelOrder, useOrder } from "@/hooks/use-orders";
import { Receipt } from "@/components/orders/receipt";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { usePermissions } from "../../../../hooks/use-permissions";
import { VoidOrderDialog } from "@/components/orders/VoidOrderDialog";

// ── helpers ──────────────────────────────────────────────────────────────────

const statusConfig = {
  COMPLETED: {
    variant: "default" as const,
    icon: CheckCircle2,
    color: "text-green-600",
    label: "Completed",
  },
  CANCELLED: {
    variant: "destructive" as const,
    icon: Ban,
    color: "text-destructive",
    label: "Cancelled",
  },
  VOIDED: {
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-destructive",
    label: "Voided",
  },
  PENDING: {
    variant: "secondary" as const,
    icon: Clock,
    color: "text-muted-foreground",
    label: "Pending",
  },
};

const methodConfig: Record<string, { label: string; icon: React.ElementType }> =
  {
    CASH: { label: "Cash", icon: Banknote },
    MPESA: { label: "M-Pesa", icon: Smartphone },
    CARD: { label: "CreditCard", icon: CreditCard },
  };

function DetailRow({
  label,
  value,
  icon: Icon,
  refN,
  phoneN,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  refN?: string;
  phoneN?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm border-b last:border-0">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          {Icon && <Icon size={14} />}
          {label}
        </div>
        {refN && phoneN && (
          <span className="flex flex-col space-y-2">
            <span className="text-xs text-muted-foreground">Ref: {refN}</span>
            <span className="text-xs text-muted-foreground">
              Phone Number: {phoneN}
            </span>
          </span>
        )}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function OrderViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showCancel, setShowCancel] = useState(false);
  const { can } = usePermissions();
  const [voidOpen, setVoidOpen] = useState(false);

  const { data: order, isLoading } = useOrder(id);
  const { mutate: cancel, isPending: cancelling } = useCancelOrder(() =>
    setShowCancel(false),
  );

  const receiptRef = useRef<HTMLDivElement>(null);

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

  // ── loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-120 rounded-xl" />
        </div>
      </div>
    );
  }

  // ── not found ──────────────────────────────────────────────────────────────
  if (!order) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-96 gap-3">
        <p className="text-muted-foreground text-sm">Order not found.</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft size={14} className="mr-1.5" /> Go back
        </Button>
      </div>
    );
  }

  const sc =
    statusConfig[order.status as keyof typeof statusConfig] ??
    statusConfig.PENDING;
  const StatusIcon = sc.icon;
  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
  const change = order.payment ? order.payment.amount - order.total : 0;

  // ── page ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/orders">Orders</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{order.orderNumber}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold font-mono">
                {order.orderNumber}
              </h1>
              <Badge variant={sc.variant} className="gap-1">
                <StatusIcon size={12} />
                {sc.label}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              {format(
                new Date(order.createdAt),
                "EEEE, dd MMM yyyy 'at' HH:mm",
              )}
              {" · "}
              <span className="italic">
                {formatDistanceToNow(new Date(order.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {can("orders.cancel") && order.status === "COMPLETED" && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/40
               hover:bg-destructive/10"
              onClick={() => setVoidOpen(true)}
            >
              <XCircle size={13} className="mr-1.5" /> Cancel Order
            </Button>
          )}
          <Button size="sm" onClick={() => handlePrint()}>
            <Printer size={14} className="mr-1.5" /> Print Receipt
          </Button>
        </div>
      </div>

      <VoidOrderDialog
        open={voidOpen}
        onClose={() => setVoidOpen(false)}
        orderId={order.id}
        orderNumber={order.orderNumber}
        orderTotal={order.total}
      />

      <Separator />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col — details */}
        <div className="lg:col-span-2 space-y-4">
          {/* ── Order summary ─────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Info size={16} /> Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow
                icon={Hash}
                label="Order number"
                value={
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                    {order.orderNumber}
                  </span>
                }
              />
              <DetailRow
                icon={StatusIcon}
                label="Status"
                value={
                  <Badge variant={sc.variant} className="gap-1">
                    <StatusIcon size={11} />
                    {sc.label}
                  </Badge>
                }
              />
              <DetailRow
                icon={Clock}
                label="Created"
                value={format(
                  new Date(order.createdAt),
                  "dd MMM yyyy, HH:mm:ss",
                )}
              />
              <DetailRow
                icon={Clock}
                label="Last updated"
                value={format(
                  new Date(order.updatedAt),
                  "dd MMM yyyy, HH:mm:ss",
                )}
              />
              <DetailRow
                icon={Package}
                label="Total items"
                value={`${totalItems} unit${totalItems !== 1 ? "s" : ""} across ${order.items.length} product${order.items.length !== 1 ? "s" : ""}`}
              />
              {order.note && (
                <DetailRow
                  icon={Info}
                  label="Note"
                  value={
                    <span className="italic text-muted-foreground">
                      {order.note}
                    </span>
                  }
                />
              )}
            </CardContent>
          </Card>

          {/* ── Order items ───────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package size={16} /> Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between
                               py-3 border-b last:border-0"
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium text-sm">{item.productName}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        SKU: {item.sku}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × KES {item.unitPrice.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        KES {item.total.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} unit{item.quantity !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals breakdown */}
              <div className="mt-3 pt-3 border-t space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>KES {order.subtotal.toLocaleString()}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>− KES {order.discount.toLocaleString()}</span>
                  </div>
                )}
                {order.tax > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span>KES {order.tax.toLocaleString()}</span>
                  </div>
                )}
                <div
                  className="flex justify-between font-bold text-base
                                pt-2 border-t mt-1"
                >
                  <span>Total</span>
                  <span>KES {order.total.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-muted-foreground">
                  <span>Amount Paid</span>
                  <span>KES {order.amountPaid.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-muted-foreground">
                  <span>Change</span>
                  <span>KES {order.change.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Payment details ───────────────────────────────────────────── */}
          {order.payment && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard size={16} /> Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DetailRow
                  label="Amount paid"
                  value={`KES ${order.payment.amount.toLocaleString()}`}
                />
                <DetailRow
                  label="Order total"
                  value={`KES ${order.total.toLocaleString()}`}
                />
                {change > 0 && (
                  <DetailRow
                    label="Change given"
                    value={
                      <span className="text-green-600 font-semibold">
                        KES {change.toLocaleString()}
                      </span>
                    }
                  />
                )}
                {/* {order.payment.mpesaRef && (
                  <DetailRow
                    label="M-Pesa reference"
                    value={
                      <span
                        className="font-mono text-xs bg-muted
                                       px-2 py-0.5 rounded font-semibold"
                      >
                        {order.payment.mpesaRef}
                      </span>
                    }
                  />
                )}
                {order.payment.mpesaPhone && (
                  <DetailRow
                    label="M-Pesa phone"
                    value={order.payment.mpesaPhone}
                  />
                )} */}
                <DetailRow
                  label="Payment time"
                  value={format(
                    new Date(order.payment.createdAt),
                    "dd MMM yyyy, HH:mm:ss",
                  )}
                />
                <h3 className="my-4">Payment Methods</h3>
                {order.payment.splitPayments &&
                  order.payment.splitPayments.map((sp) => {
                    const methodInfo = methodConfig[sp.method];
                    const MethodIcon = methodInfo?.icon;
                    return (
                      <div key={sp.id} className="space-y-2">
                        <DetailRow
                          key={sp.id}
                          icon={MethodIcon}
                          label={methodInfo?.label ?? sp.method}
                          value={`KES ${sp.amount.toLocaleString()}`}
                          refN={sp.mpesaRef ?? ""}
                          phoneN={sp.mpesaPhone ?? ""}
                        />
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right col — receipt preview */}
        <div>
          <Card className="md:sticky md:top-35">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Printer size={16} /> Receipt Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <Receipt ref={receiptRef} order={order} />
              <Button
                className="w-full mt-4"
                variant="outline"
                onClick={() => handlePrint()}
              >
                <Printer size={14} className="mr-1.5" /> Print
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel confirmation */}
      <AlertDialog open={showCancel} onOpenChange={setShowCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {order.orderNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the order and restore stock for all {totalItems}{" "}
              unit(s) across {order.items.length} product(s). This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep order</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => cancel(id)}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling..." : "Cancel order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
