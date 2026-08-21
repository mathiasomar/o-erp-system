"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { Receipt } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ReceiptText,
  Search,
  X,
  Combine,
  Copy,
  XCircle,
  Eye,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { reprintReceipt } from "@/actions/receipt.action";
import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";
import { VoidReceiptDialog } from "@/components/receipt/VoidReceiptDialog";
import { useBranchId } from "@/hooks/use-branches";
import { CombineReceiptsDialog } from "@/components/receipt/CombineReceiptDialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ReceiptViewDialog } from "@/components/receipt/ReceiptViewDialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePermissions } from "@/hooks/use-permissions";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ElementType;
    color: string;
  }
> = {
  ACTIVE: {
    label: "Active",
    variant: "default",
    icon: CheckCircle2,
    color: "text-green-600",
  },
  VOIDED: {
    label: "Voided",
    variant: "destructive",
    icon: XCircle,
    color: "text-destructive",
  },
  COMBINED: {
    label: "Combined",
    variant: "secondary",
    icon: Combine,
    color: "text-muted-foreground",
  },
  DUPLICATE: {
    label: "Duplicate",
    variant: "outline",
    icon: Copy,
    color: "text-blue-600",
  },
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  SALE: { label: "Sale", color: "text-green-600" },
  RETURN: { label: "Return", color: "text-orange-600" },
  COMBINED: { label: "Combined", color: "text-blue-600" },
  DUPLICATE: { label: "Duplicate", color: "text-muted-foreground" },
};

// ── Row actions ───────────────────────────────────────────────────────────────

function ReceiptRowActions({ receipt }: { receipt: Receipt }) {
  const qc = useQueryClient();
  const [voidOpen, setVoidOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const { can } = usePermissions();

  const handleReprint = () => {
    startTransition(async () => {
      const result = await reprintReceipt(receipt.id);
      if (result.success) {
        qc.invalidateQueries({ queryKey: ["receipts"] });
        toast.success(
          `Duplicate receipt created: ${result.receipt?.receiptNumber}`,
        );
      } else {
        toast.error(result.error ?? "Failed to reprint");
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {/* View */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setOpen(true)}
            >
              <Eye size={13} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>View receipt</TooltipContent>
        </Tooltip>

        {/* Print */}
        {/* <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Printer size={13} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Print</TooltipContent>
        </Tooltip> */}

        {/* Reprint (creates duplicate record) */}
        {can("receipts.reprint") && receipt.status !== "VOIDED" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={isPending}
                onClick={handleReprint}
              >
                <Copy size={13} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reprint (creates duplicate record)</TooltipContent>
          </Tooltip>
        )}

        {/* Void */}
        {can("receipts.void") && receipt.status === "ACTIVE" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => setVoidOpen(true)}
              >
                <XCircle size={13} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Void receipt</TooltipContent>
          </Tooltip>
        )}
      </div>

      <VoidReceiptDialog
        open={voidOpen}
        onClose={() => setVoidOpen(false)}
        receiptId={receipt.id}
        receiptNumber={receipt.receiptNumber}
        total={receipt.total}
      />

      <ReceiptViewDialog
        open={open}
        onClose={() => setOpen(false)}
        receipt={receipt}
      />
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReceiptsPage() {
  const branchId = useBranchId();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [combineOpen, setCombineOpen] = useState(false);
  const { can } = usePermissions();

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: [
      "receipts",
      branchId,
      search,
      statusFilter,
      typeFilter,
      from,
      to,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const { data } = await api.get<Receipt[]>(`/api/receipts?${params}`);
      return data;
    },
  });

  const hasFilters =
    search || statusFilter !== "ALL" || typeFilter !== "ALL" || from || to;
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setFrom("");
    setTo("");
  };

  // KPI stats
  const activeReceipts = receipts.filter((r) => r.status === "ACTIVE");
  const voidedReceipts = receipts.filter((r) => r.status === "VOIDED");
  const totalRevenue = activeReceipts.reduce((s, r) => s + r.total, 0);
  const eligibleForCombine = activeReceipts.filter(
    (r) => r.type !== "COMBINED",
  );

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Receipts</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ReceiptText size={22} /> Receipts
          </h1>
          <p className="text-muted-foreground text-sm">
            All receipt records — issue, void, combine, reprint
          </p>
        </div>
        {can("receipts.combine") && (
          <Button
            variant="outline"
            onClick={() => setCombineOpen(true)}
            disabled={eligibleForCombine.length < 2}
          >
            <Combine size={14} className="mr-1.5" />
            Combine receipts
          </Button>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total",
            value: receipts.length,
            color: "",
            icon: ReceiptText,
            bg: "bg-muted",
          },
          {
            label: "Active",
            value: activeReceipts.length,
            color: "text-green-600",
            icon: CheckCircle2,
            bg: "bg-green-50 dark:bg-green-950/20",
          },
          {
            label: "Voided",
            value: voidedReceipts.length,
            color: "text-destructive",
            icon: XCircle,
            bg: "bg-red-50 dark:bg-red-950/20",
          },
          {
            label: "Revenue",
            value: `KES ${totalRevenue.toLocaleString()}`,
            color: "text-primary",
            icon: TrendingUp,
            bg: "bg-primary/5",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-1">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <div className={cn("p-1.5 rounded-lg", s.bg)}>
                  <s.icon size={13} className={s.color} />
                </div>
              </div>
              <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-56 max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2
                                         text-muted-foreground pointer-events-none"
            />
            <Input
              placeholder="Search receipt no, cashier, customer..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="VOIDED">Voided</SelectItem>
              <SelectItem value="COMBINED">Combined</SelectItem>
              <SelectItem value="DUPLICATE">Duplicate</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="SALE">Sale</SelectItem>
              <SelectItem value="COMBINED">Combined</SelectItem>
              <SelectItem value="DUPLICATE">Duplicate</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={clearFilters}
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

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : receipts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center h-48 gap-3
                        text-muted-foreground"
        >
          <ReceiptText size={32} className="opacity-20" />
          <p className="text-sm">No receipts found</p>
        </div>
      ) : (
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <div className="min-w-[1200px]">
            <Table className="text-sm">
              <TableHeader>
                <TableRow>
                  {[
                    "Receipt #",
                    "Type",
                    "Status",
                    "Items",
                    "Cashier",
                    "Customer",
                    "Total",
                    "Date",
                    "",
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className="px-4 py-2.5 text-left text-xs font-medium
                                          text-muted-foreground whitespace-nowrap"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((receipt) => {
                  const sc = STATUS_CONFIG[receipt.status];
                  const tc = TYPE_CONFIG[receipt.type];
                  const Icon = sc.icon;
                  return (
                    <TableRow
                      key={receipt.id}
                      className="border-t hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <span className="font-mono text-xs font-semibold">
                            {receipt.receiptNumber}
                          </span>
                          {receipt.order && receipt.orderId && (
                            <p className="text-[10px] text-muted-foreground font-mono">
                              Order #{receipt.orderId.slice(-6)}
                            </p>
                          )}
                          {receipt.parentReceipt && (
                            <p className="text-[10px] text-muted-foreground">
                              → {receipt.parentReceipt.receiptNumber}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-medium", tc.color)}>
                          {tc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={sc.variant}
                          className="gap-1 text-[10px]"
                        >
                          <Icon size={10} />
                          {sc.label}
                        </Badge>
                        {receipt.status === "VOIDED" && receipt.voidReason && (
                          <p
                            className="text-[10px] text-muted-foreground mt-0.5 max-w-24 truncate"
                            title={receipt.voidReason}
                          >
                            {receipt.voidReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {receipt.items.reduce((s, i) => s + i.quantity, 0)}{" "}
                        units
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs">
                          {receipt.user?.name ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs">
                          {receipt.customer?.name ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        KES {receipt.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        <p>
                          {format(new Date(receipt.createdAt), "dd MMM yyyy")}
                        </p>
                        <p>{format(new Date(receipt.createdAt), "HH:mm")}</p>
                      </td>
                      <td className="px-4 py-3">
                        <ReceiptRowActions receipt={receipt} />
                      </td>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Combine dialog */}
      <CombineReceiptsDialog
        open={combineOpen}
        onClose={() => setCombineOpen(false)}
        receipts={receipts}
      />
    </div>
  );
}
