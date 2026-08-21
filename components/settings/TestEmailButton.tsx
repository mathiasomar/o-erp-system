"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "@/lib/axios";
import { toast } from "sonner";

export const TestEmailButton = () => {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  const handleTest = () => {
    startTransition(async () => {
      try {
        const { data } = await api.post("/api/settings/test-email");
        toast.success(data.message);
        setStatus("ok");
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Test email failed";
        toast.error(message);
        setStatus("error");
      }
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleTest}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 size={14} className="mr-1.5 animate-spin" />
      ) : status === "ok" ? (
        <CheckCircle size={14} className="mr-1.5 text-green-500" />
      ) : status === "error" ? (
        <AlertCircle size={14} className="mr-1.5 text-destructive" />
      ) : (
        <Mail size={14} className="mr-1.5" />
      )}
      {isPending ? "Sending..." : "Send test email"}
    </Button>
  );
};
