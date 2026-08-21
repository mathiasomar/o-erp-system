"use client";

import { BranchLabel } from "@/components/layout/BranchLabel";
import { mpesaColumns } from "@/components/payments/mpesa/MpesaColumns";
import { MpesaDataTable } from "@/components/payments/mpesa/MpesaDatatable";
import { MpesaStatementButton } from "@/components/payments/mpesa/MpesaStatementButton";
import { PaymentStatCard } from "@/components/payments/PaymentStatCards";
import { useSystemSettings } from "@/components/providers/SettingsProvider";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranches, useBranchId } from "@/hooks/use-branches";
import { useMpesaTransactions } from "@/hooks/use-mpesa-transactions";
import {
  CheckCircle2,
  Clock,
  Search,
  Smartphone,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";

const STATUSES = ["ALL", "SUCCESS", "PENDING", "FAILED"];

const MpesaPage = () => {
  // ── M-Pesa filters ────────────────────────────────────────────────────────
  const [mSearch, setMSearch] = useState("");
  const [mStatus, setMStatus] = useState("ALL");
  const [mFrom, setMFrom] = useState("");
  const [mTo, setMTo] = useState("");

  const { data: branchId = "" } = useBranchId();
  const { data: branches = [] } = useBranches();

  const current = branches.find((b) => b.id === branchId);

  const { settings } = useSystemSettings();

  const { data: mpesaData, isLoading: mpesaLoading } = useMpesaTransactions({
    search: mSearch || undefined,
    status: mStatus === "ALL" ? undefined : mStatus,
    from: mFrom || undefined,
    to: mTo || undefined,
  });

  const transactions = mpesaData?.transactions ?? [];
  const mpesaSummary = mpesaData?.summary ?? {
    totalSuccess: 0,
    totalPending: 0,
    totalFailed: 0,
    totalCount: 0,
  };

  const hasMpesaFilters = mSearch || mStatus !== "ALL" || mFrom || mTo;
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
            <BreadcrumbPage>Mpesa Transactions</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Mpesa Transactions</h1>
          <p className="text-muted-foreground text-sm">
            Track all M-Pesa activity
          </p>
          <BranchLabel />
        </div>
        <MpesaStatementButton
          transactions={transactions}
          filters={{
            search: mSearch || undefined,
            status: mStatus !== "ALL" ? mStatus : undefined,
            from: mFrom || undefined,
            to: mTo || undefined,
          }}
          storeName={settings.company_name || "My Store"}
          branchName={
            `[${current?.name} (${current?.code}) - Branch]` || "MAIN BRANCH"
          }
        />
      </div>

      {/* Mpesa cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PaymentStatCard
          label="Total successful"
          value={`KES ${mpesaSummary.totalSuccess.toLocaleString()}`}
          sub={`${transactions.filter((t) => t.status === "SUCCESS").length} transactions`}
          icon={CheckCircle2}
          color="text-green-600"
        />
        <PaymentStatCard
          label="Pending"
          value={`${mpesaSummary.totalPending}`}
          sub="Awaiting response"
          icon={Clock}
          color="text-muted-foreground"
        />
        <PaymentStatCard
          label="Failed"
          value={`${mpesaSummary.totalFailed}`}
          sub="Cancelled or errored"
          icon={XCircle}
          color="text-destructive"
        />
        <PaymentStatCard
          label="Total initiated"
          value={`${mpesaSummary.totalCount}`}
          sub="All STK Push requests"
          icon={Smartphone}
          color="text-blue-600"
        />
      </div>

      {/* M-Pesa filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-56 max-w-sm">
            <Search
              className="absolute left-3 top-2.5 text-muted-foreground"
              size={15}
            />
            <Input
              placeholder="Search receipt no, phone, checkout ID..."
              className="pl-9"
              value={mSearch}
              onChange={(e) => setMSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map((s) => (
              <Badge
                key={s}
                variant={mStatus === s ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setMStatus(s)}
              >
                {s}
              </Badge>
            ))}
          </div>
          {hasMpesaFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                setMSearch("");
                setMStatus("ALL");
                setMFrom("");
                setMTo("");
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
            value={mFrom}
            onChange={(e) => setMFrom(e.target.value)}
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            className="w-40 text-sm"
            value={mTo}
            onChange={(e) => setMTo(e.target.value)}
          />
        </div>
      </div>

      {mpesaLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <MpesaDataTable data={transactions} columns={mpesaColumns} />
      )}
    </div>
  );
};

export default MpesaPage;
