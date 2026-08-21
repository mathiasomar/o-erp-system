"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/axios";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useInitiateMpesa } from "@/hooks/use-initiate-mpesa";

type Status = "idle" | "sending" | "waiting" | "success" | "failed";

type Props = {
  amount: number;
  orderNumber: string;
  onConfirmed: (mpesaRef: string, phone: string) => void;
  onReset: () => void;
};

export function MpesaStkPush({
  amount,
  orderNumber,
  onConfirmed,
  onReset,
}: Props) {
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [checkoutRequestId, setCheckoutRequestId] = useState("");
  const [mpesaRef, setMpesaRef] = useState("");
  const [failDesc, setFailDesc] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(60);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const statusRef = useRef<Status>(status);

  const { mutate: initiate, isPending } = useInitiateMpesa((id) => {
    setCheckoutRequestId(id);
    setStatus("waiting");
    setSecondsLeft(60);
    startPolling(id);
    startCountdown();
  });

  function startCountdown() {
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          if (statusRef.current === "waiting") {
            clearAll();
            setStatus("failed");
            setFailDesc("Payment timed out — no response from customer");
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function startPolling(id: string) {
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/api/mpesa/status/${id}`);
        if (data.status === "SUCCESS") {
          clearAll();
          setStatus("success");
          setMpesaRef(data.mpesaReceiptNumber ?? "");
          onConfirmed(data.mpesaReceiptNumber ?? "", data.phoneNumber ?? phone);
        } else if (data.status === "FAILED") {
          clearAll();
          setStatus("failed");
          setFailDesc(data.resultDesc ?? "Payment failed");
        }
      } catch {
        // Keep polling on network error
      }
    }, 3000);
  }

  function clearAll() {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  useEffect(() => () => clearAll(), []);

  // Update status ref
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  function validatePhone(value: string) {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length < 9) return "Enter a valid phone number";
    return "";
  }

  function handleSend() {
    const err = validatePhone(phone);
    if (err) {
      setPhoneError(err);
      return;
    }
    setPhoneError("");
    setStatus("sending");
    initiate({ phone, amount, orderNumber });
  }

  function handleRetry() {
    setStatus("idle");
    setCheckoutRequestId("");
    setMpesaRef("");
    setFailDesc("");
    setSecondsLeft(60);
  }

  // ── Idle: phone entry ──────────────────────────────────────────────────────
  if (status === "idle" || status === "sending") {
    return (
      <FieldGroup className="space-y-3">
        <Field data-invalid={!!phoneError}>
          <FieldLabel htmlFor="mpesa-phone">
            Customer phone <span className="text-destructive">*</span>
          </FieldLabel>
          <div className="flex gap-2">
            <Input
              id="mpesa-phone"
              placeholder="e.g. 0712345678"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneError("");
              }}
              disabled={isPending}
              autoComplete="off"
            />
            <Button
              type="button"
              onClick={handleSend}
              disabled={isPending || !phone}
              className="shrink-0"
            >
              {isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Smartphone size={15} />
              )}
              {isPending ? "Sending..." : "Send"}
            </Button>
          </div>
          <FieldDescription>
            An STK Push will be sent to this number for KES{" "}
            {amount.toLocaleString()}
          </FieldDescription>
          {phoneError && <FieldError errors={[{ message: phoneError }]} />}
        </Field>
      </FieldGroup>
    );
  }

  // ── Waiting for customer ───────────────────────────────────────────────────
  if (status === "waiting") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="relative">
          <Smartphone size={40} className="text-primary" />
          <Loader2
            size={16}
            className="animate-spin text-primary absolute -top-1 -right-1"
          />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-sm">Waiting for customer</p>
          <p className="text-xs text-muted-foreground">
            STK Push sent to <span className="font-mono">{phone}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Amount:{" "}
            <span className="font-semibold">KES {amount.toLocaleString()}</span>
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {secondsLeft}s remaining
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => {
            clearAll();
            handleRetry();
          }}
        >
          Cancel
        </Button>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 size={40} className="text-green-600" />
        <div className="space-y-1">
          <p className="font-medium text-sm text-green-600">
            Payment confirmed
          </p>
          <p className="text-xs text-muted-foreground">
            KES {amount.toLocaleString()} received
          </p>
          {mpesaRef && (
            <p className="text-xs font-mono bg-muted px-2 py-1 rounded">
              Ref: {mpesaRef}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Failed ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <XCircle size={40} className="text-destructive" />
      <div className="space-y-1">
        <p className="font-medium text-sm text-destructive">Payment failed</p>
        <p className="text-xs text-muted-foreground">{failDesc}</p>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleRetry}>
          <RefreshCw size={13} className="mr-1.5" /> Retry
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          Change method
        </Button>
      </div>
    </div>
  );
}
