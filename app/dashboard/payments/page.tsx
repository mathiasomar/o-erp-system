"use client";

import { useState } from "react";
import { paymentColumns } from "@/components/payments/PaymentColumns";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Banknote,
  Smartphone,
  CreditCard,
  TrendingUp,
  Search,
  X,
} from "lucide-react";
import { usePayments } from "@/hooks/use-payments";
import { PaymentStatCard } from "@/components/payments/PaymentStatCards";
import { PaymentsDataTable } from "@/components/payments/PaymentDatatable";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BranchLabel } from "@/components/layout/BranchLabel";

const METHODS = ["ALL", "CASH", "MPESA", "CARD"];

export default function PaymentsPage() {
  // ── All payments filters ───────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: payData, isLoading: payLoading } = usePayments({
    search: search || undefined,
    method: method === "ALL" ? undefined : method,
    from: from || undefined,
    to: to || undefined,
  });

  const payments = payData?.payments ?? [];
  const totalRevenue = payData?.totalRevenue ?? 0;
  const byMethod = payData?.byMethod ?? { CASH: 0, MPESA: 0, CARD: 0 };

  const hasPayFilters = search || method !== "ALL" || from || to;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Payments</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground text-sm">
          Track all payment transactions
        </p>
        <BranchLabel />
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PaymentStatCard
          label="Total revenue"
          value={`KES ${totalRevenue.toLocaleString()}`}
          sub={`${payments.length} transaction${payments.length !== 1 ? "s" : ""}`}
          icon={TrendingUp}
          color="text-primary"
        />
        <PaymentStatCard
          label="Cash"
          value={`KES ${byMethod.CASH.toLocaleString()}`}
          sub={`${payments.filter((p) => p.splitPayments.some((sp) => sp.method === "CASH")).length} payments`}
          icon={Banknote}
          color="text-green-600"
        />
        <PaymentStatCard
          label="M-Pesa"
          value={`KES ${byMethod.MPESA.toLocaleString()}`}
          sub={`${payments.filter((p) => p.splitPayments.some((sp) => sp.method === "MPESA")).length} payments`}
          icon={Smartphone}
          color="text-blue-600"
        />
        <PaymentStatCard
          label="Card"
          value={`KES ${byMethod.CARD.toLocaleString()}`}
          sub={`${payments.filter((p) => p.splitPayments.some((sp) => sp.method === "CARD")).length} payments`}
          icon={CreditCard}
          color="text-purple-600"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-56 max-w-sm">
            <Search
              className="absolute left-3 top-2.5 text-muted-foreground"
              size={15}
            />
            <Input
              placeholder="Search order no, M-Pesa ref, phone..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {METHODS.map((m) => (
              <Badge
                key={m}
                variant={method === m ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setMethod(m)}
              >
                {m}
              </Badge>
            ))}
          </div>
          {hasPayFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                setSearch("");
                setMethod("ALL");
                setFrom("");
                setTo("");
              }}
            >
              <X size={13} className="mr-1" /> Clear
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Date range:</span>
          <Input
            type="date"
            className="w-40 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            className="w-40 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      {payLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <PaymentsDataTable data={payments} columns={paymentColumns} />
      )}
    </div>
  );
}
