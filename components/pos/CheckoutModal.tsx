"use client";

import { useState } from "react";
import { CustomerSearchResult, Order } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field";
import { CustomerPicker } from "@/components/customer/CustomerPicker";
import {
  Banknote,
  Smartphone,
  CreditCard,
  Loader2,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useCreateOrder } from "@/hooks/use-orders";
import { MpesaStkPush } from "./MpesaStkPush";
import { ScrollArea } from "../ui/scroll-area";

type PaymentMethod = "CASH" | "MPESA" | "CARD";
type MpesaMode = "stk" | "manual";

type PaymentEntry = {
  id: string;
  method: PaymentMethod;
  amount: string;
  mpesaRef: string;
  mpesaPhone: string;
  mpesaConfirmed: boolean;
  mpesaMode: MpesaMode;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (order: Order) => void;
};

const METHODS: {
  value: PaymentMethod;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "CASH", label: "Cash", icon: Banknote },
  { value: "MPESA", label: "M-Pesa", icon: Smartphone },
  { value: "CARD", label: "Card", icon: CreditCard },
];

function createPaymentEntry(method: PaymentMethod): PaymentEntry {
  return {
    id: `${method}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    method,
    amount: "",
    mpesaRef: "",
    mpesaPhone: "",
    mpesaConfirmed: false,
    mpesaMode: "stk",
  };
}

export function CheckoutModal({ open, onClose, onSuccess }: Props) {
  const { items, total, clearCart } = useCartStore();

  const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([
    createPaymentEntry("CASH"),
  ]);
  const [note, setNote] = useState("");
  const [customer, setCustomer] = useState<CustomerSearchResult | null>(null);
  const [orderNumber] = useState(() => `PENDING-${Date.now()}`);

  const { mutate, isPending } = useCreateOrder((order) => {
    clearCart();
    onSuccess(order);
    handleClose();
  });

  const orderTotal = total();
  const paymentsTotal = paymentEntries.reduce(
    (sum, e) => sum + (parseFloat(e.amount) || 0),
    0,
  );

  const paymentDifference = paymentsTotal - orderTotal;
  const isOverpaying = paymentDifference > 0.01;
  const isUnderpaying = paymentDifference < -0.01;

  // Changed: Allow confirm when payments meet or exceed total (not just exact match)
  const paymentMismatch = isUnderpaying;

  const hasPositiveAmounts = paymentEntries.every(
    (e) => (parseFloat(e.amount) || 0) > 0,
  );

  // ── Key fix: manual mode is confirmed when ref is non-empty ───────────────
  const hasMpesaConfirmation = paymentEntries.every((e) => {
    if (e.method !== "MPESA") return true;
    if (e.mpesaMode === "manual") {
      // Manual: just need a non-empty ref
      return e.mpesaRef.trim().length > 0;
    }
    // STK: need the push to have completed
    return e.mpesaConfirmed;
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  function handleClose() {
    setPaymentEntries([createPaymentEntry("CASH")]);
    setNote("");
    onClose();
  }

  function toggleMethod(method: PaymentMethod) {
    setPaymentEntries((prev) => {
      const exists = prev.some((e) => e.method === method);
      if (exists) return prev.filter((e) => e.method !== method);
      return [...prev, createPaymentEntry(method)];
    });
  }

  function updateEntryAmount(id: string, value: string) {
    setPaymentEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        // Only reset MPESA STK confirmation when amount changes
        // Manual mode ref should NOT be wiped when amount changes
        if (e.method === "MPESA" && e.mpesaMode === "stk" && e.mpesaConfirmed) {
          return {
            ...e,
            amount: value,
            mpesaRef: "",
            mpesaPhone: "",
            mpesaConfirmed: false,
          };
        }
        return { ...e, amount: value };
      }),
    );
  }

  function setMpesaMode(id: string, mode: MpesaMode) {
    setPaymentEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              mpesaMode: mode,
              mpesaRef: "",
              mpesaPhone: "",
              mpesaConfirmed: false,
            }
          : e,
      ),
    );
  }

  // Called by MpesaStkPush on success
  function updateMpesaEntry(
    id: string,
    ref: string,
    phone: string,
    confirmed: boolean,
  ) {
    setPaymentEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              mpesaRef: ref,
              mpesaPhone: phone,
              mpesaConfirmed: confirmed,
            }
          : e,
      ),
    );
  }

  // Called for manual field edits
  function updateManualMpesa(
    id: string,
    field: "mpesaRef" | "mpesaPhone",
    value: string,
  ) {
    setPaymentEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  }

  function handleConfirm() {
    // Calculate total paid
    const totalPaid = paymentEntries
      .filter((e) => (parseFloat(e.amount) || 0) > 0)
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    // Calculate change
    const change = totalPaid - orderTotal;

    // Create payments array with actual amounts
    const payments = paymentEntries
      .filter((e) => (parseFloat(e.amount) || 0) > 0)
      .map((e) => {
        const amount = Number((parseFloat(e.amount) || 0).toFixed(2));

        if (e.method === "MPESA") {
          return {
            method: e.method,
            amount,
            mpesaRef: e.mpesaRef.trim() || undefined,
            mpesaPhone: e.mpesaPhone.trim() || undefined,
          };
        }

        return { method: e.method, amount };
      });

    const payload: Record<string, unknown> = {
      items: items.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        sku: i.product.sku,
        quantity: i.quantity,
        unitPrice: i.customPrice ?? i.product.price,
        isCustomPrice: i.customPrice !== null && i.customPrice !== undefined,
      })),
      subtotal: orderTotal,
      discount: 0,
      tax: 0,
      total: orderTotal,
      payments,
      // Send change amount if overpaying
      change: change > 0 ? Number(change.toFixed(2)) : 0,
      // Send the total paid amount
      amountPaid: Number(totalPaid.toFixed(2)),
    };

    if (note.trim()) payload.note = note.trim();
    if (customer?.id) payload.customerId = customer.id;

    mutate(payload as never);
  }

  const canConfirm =
    items.length > 0 &&
    paymentEntries.length > 0 &&
    hasPositiveAmounts &&
    hasMpesaConfirmation &&
    !paymentMismatch;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>
            Confirm the order and record payment.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh] px-4">
          <div className="space-y-4">
            <CustomerPicker
              value={customer}
              onChange={setCustomer}
              onNewCustomer={() => {
                onClose();
                window.dispatchEvent(
                  new CustomEvent("open-new-customer-sheet"),
                );
              }}
            />

            {/* Order summary */}
            <div
              className="rounded-lg border bg-muted/40 p-3 space-y-1.5
                            max-h-40 overflow-y-auto"
            >
              {items.map(({ product, quantity, customPrice }) => {
                const unitPrice = customPrice ?? product.price;
                const isCustom =
                  customPrice !== null && customPrice !== undefined;
                return (
                  <div
                    key={product.id}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {product.name} × {quantity}
                      {isCustom && (
                        <span className="ml-1.5 text-[10px] text-orange-500 font-medium">
                          (negotiated)
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "font-medium",
                        isCustom && "text-orange-600",
                      )}
                    >
                      KES {(unitPrice * quantity).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Show breakdown of custom vs regular prices */}
            {items.some(
              (i) => i.customPrice !== null && i.customPrice !== undefined,
            ) && (
              <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-2.5 space-y-1">
                <p className="text-xs font-medium text-orange-700">
                  Price breakdown:
                </p>
                {items.map(({ product, quantity, customPrice }) => {
                  const unitPrice = customPrice ?? product.price;
                  const isCustom =
                    customPrice !== null && customPrice !== undefined;
                  if (!isCustom) return null;
                  return (
                    <div
                      key={product.id}
                      className="flex justify-between text-xs"
                    >
                      <span className="text-muted-foreground">
                        {product.name} (negotiated)
                      </span>
                      <span className="font-medium text-orange-600">
                        KES {unitPrice.toLocaleString()} × {quantity}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>KES {orderTotal.toLocaleString()}</span>
            </div>

            {/* Show payment summary with change */}
            {paymentEntries.some((e) => (parseFloat(e.amount) || 0) > 0) && (
              <div className="rounded-lg border p-3 space-y-1.5 bg-muted/20">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total paid</span>
                  <span className="font-medium">
                    KES {paymentsTotal.toLocaleString()}
                  </span>
                </div>
                {isOverpaying && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Change</span>
                    <span className="font-bold">
                      KES {paymentDifference.toLocaleString()}
                    </span>
                  </div>
                )}
                {isUnderpaying && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Remaining balance</span>
                    <span className="font-bold">
                      KES {Math.abs(paymentDifference).toLocaleString()}
                    </span>
                  </div>
                )}
                {!isOverpaying && !isUnderpaying && paymentsTotal > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Status</span>
                    <span className="font-medium">✓ Exact payment</span>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Method selector */}
            <FieldGroup>
              <FieldLabel>Payment method</FieldLabel>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {METHODS.map(({ value, label, icon: Icon }) => {
                  const selected = paymentEntries.some(
                    (e) => e.method === value,
                  );
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleMethod(value)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-lg",
                        "border text-sm transition-colors",
                        selected
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <Icon size={18} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </FieldGroup>

            {/* Payment entry cards */}
            {paymentEntries.map((entry) => {
              const methodLabel = METHODS.find(
                (m) => m.value === entry.method,
              )?.label;
              const amountValue = parseFloat(entry.amount) || 0;
              const isMpesa = entry.method === "MPESA";
              const isManual = entry.mpesaMode === "manual";
              const manualReady = isManual && entry.mpesaRef.trim().length > 0;

              return (
                <div key={entry.id} className="rounded-lg border p-3 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{methodLabel}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground h-7 px-2"
                      onClick={() =>
                        setPaymentEntries((prev) =>
                          prev.filter((item) => item.id !== entry.id),
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>

                  {/* Amount */}
                  <Field>
                    <FieldLabel htmlFor={`amount-${entry.id}`}>
                      Amount ({methodLabel}) (KES)
                    </FieldLabel>
                    <Input
                      id={`amount-${entry.id}`}
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder={orderTotal.toString()}
                      value={entry.amount}
                      onChange={(e) =>
                        updateEntryAmount(entry.id, e.target.value)
                      }
                    />
                  </Field>

                  {/* MPESA section */}
                  {isMpesa && (
                    <div className="space-y-3">
                      {/* Mode toggle — hidden once STK confirms */}
                      {!entry.mpesaConfirmed && (
                        <div className="flex rounded-lg border overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setMpesaMode(entry.id, "stk")}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-1.5",
                              "py-2 text-xs font-medium transition-colors",
                              !isManual
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-muted-foreground hover:bg-muted",
                            )}
                          >
                            <Smartphone size={13} />
                            STK Push
                          </button>
                          <button
                            type="button"
                            onClick={() => setMpesaMode(entry.id, "manual")}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-1.5",
                              "py-2 text-xs font-medium transition-colors border-l",
                              isManual
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-muted-foreground hover:bg-muted",
                            )}
                          >
                            <KeyRound size={13} />
                            Enter ref
                          </button>
                        </div>
                      )}

                      {/* STK Push */}
                      {!isManual && (
                        <MpesaStkPush
                          amount={amountValue}
                          orderNumber={orderNumber}
                          onConfirmed={(ref, phone) =>
                            updateMpesaEntry(entry.id, ref, phone, true)
                          }
                          onReset={() =>
                            updateMpesaEntry(entry.id, "", "", false)
                          }
                        />
                      )}

                      {/* Manual ref entry */}
                      {isManual && (
                        <div className="space-y-2.5">
                          <Field>
                            <FieldLabel htmlFor={`mpesa-phone-${entry.id}`}>
                              Customer phone (optional)
                            </FieldLabel>
                            <Input
                              id={`mpesa-phone-${entry.id}`}
                              placeholder="e.g. 0712345678"
                              value={entry.mpesaPhone}
                              onChange={(e) =>
                                updateManualMpesa(
                                  entry.id,
                                  "mpesaPhone",
                                  e.target.value,
                                )
                              }
                            />
                          </Field>

                          <Field>
                            <FieldLabel htmlFor={`mpesa-ref-${entry.id}`}>
                              M-Pesa reference{" "}
                              <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                              id={`mpesa-ref-${entry.id}`}
                              placeholder="e.g. RGD67KQN1P"
                              value={entry.mpesaRef}
                              onChange={(e) =>
                                updateManualMpesa(
                                  entry.id,
                                  "mpesaRef",
                                  e.target.value.toUpperCase(),
                                )
                              }
                              className={cn(
                                manualReady &&
                                  "border-green-500 focus-visible:ring-green-500",
                              )}
                            />
                            <FieldDescription>
                              M-Pesa confirmation code from the customer&apos;s
                              SMS
                            </FieldDescription>
                          </Field>

                          {manualReady && (
                            <div
                              className="flex items-center gap-1.5 text-xs
                                            text-green-600 font-medium"
                            >
                              <CheckCircle2 size={13} />
                              Reference captured — ready to confirm order
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Validation messages */}
            {paymentEntries.length > 0 && paymentMismatch && (
              <FieldDescription className="text-destructive">
                Payment total must be at least KES {orderTotal.toLocaleString()}
              </FieldDescription>
            )}

            {paymentEntries.length > 0 && !hasPositiveAmounts && (
              <FieldDescription className="text-destructive">
                Enter an amount for each selected payment method.
              </FieldDescription>
            )}

            {paymentEntries.length > 0 && !hasMpesaConfirmation && (
              <FieldDescription className="text-destructive">
                {paymentEntries.some(
                  (e) => e.method === "MPESA" && e.mpesaMode === "manual",
                )
                  ? "Enter the M-Pesa reference code to continue."
                  : "Confirm each M-Pesa payment via STK push before continuing."}
              </FieldDescription>
            )}

            {/* Note */}
            <Field>
              <FieldLabel htmlFor="note">Order note (optional)</FieldLabel>
              <Input
                id="note"
                placeholder="e.g. Customer request..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>

            <Separator />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!canConfirm || isPending}
                onClick={handleConfirm}
              >
                {isPending && (
                  <Loader2 size={15} className="mr-2 animate-spin" />
                )}
                {isPending ? "Processing..." : "Confirm Order"}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
