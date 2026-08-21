"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MpesaTransaction } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowUpDown, Copy, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// ── status config ────────────────────────────────────────────────────────────

const statusConfig = {
  SUCCESS: {
    variant: "default" as const,
    icon: CheckCircle2,
    color: "text-green-600",
    label: "Success",
  },
  PENDING: {
    variant: "secondary" as const,
    icon: Clock,
    color: "text-muted-foreground",
    label: "Pending",
  },
  FAILED: {
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-destructive",
    label: "Failed",
  },
};

// ── copy button ──────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  function handleCopy() {
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
          >
            <Copy size={11} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ── columns ──────────────────────────────────────────────────────────────────

export const mpesaColumns: ColumnDef<MpesaTransaction>[] = [
  // ── Status ────────────────────────────────────────────────────────────────
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const sc = statusConfig[row.original.status] ?? statusConfig.PENDING;
      const Icon = sc.icon;
      return (
        <Badge variant={sc.variant} className="gap-1">
          <Icon size={11} />
          {sc.label}
        </Badge>
      );
    },
  },

  // ── M-Pesa receipt number ─────────────────────────────────────────────────
  {
    accessorKey: "mpesaReceiptNumber",
    header: "Receipt no.",
    cell: ({ row }) => {
      const ref = row.original.mpesaReceiptNumber;
      if (!ref) return <span className="text-muted-foreground text-xs">—</span>;
      return (
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded font-semibold">
            {ref}
          </span>
          <CopyButton value={ref} />
        </div>
      );
    },
  },

  // ── Phone ─────────────────────────────────────────────────────────────────
  {
    accessorKey: "phoneNumber",
    header: "Phone",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <span className="font-mono text-xs">{row.original.phoneNumber}</span>
        <CopyButton value={row.original.phoneNumber} />
      </div>
    ),
  },

  // ── Amount ────────────────────────────────────────────────────────────────
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

  // ── Checkout request ID ───────────────────────────────────────────────────
  {
    accessorKey: "checkoutRequestId",
    header: "Checkout ID",
    cell: ({ row }) => {
      const id = row.original.checkoutRequestId;
      return (
        <div className="flex items-center gap-1">
          <span className="font-mono text-[11px] text-muted-foreground max-w-30 truncate">
            {id}
          </span>
          <CopyButton value={id} />
        </div>
      );
    },
  },

  // ── Merchant request ID ───────────────────────────────────────────────────
  {
    accessorKey: "merchantRequestId",
    header: "Merchant ID",
    cell: ({ row }) => {
      const id = row.original.merchantRequestId;
      return (
        <div className="flex items-center gap-1">
          <span className="font-mono text-[11px] text-muted-foreground max-w-25 truncate">
            {id}
          </span>
          <CopyButton value={id} />
        </div>
      );
    },
  },

  // ── Result description ────────────────────────────────────────────────────
  {
    accessorKey: "resultDesc",
    header: "Result",
    cell: ({ row }) => {
      const desc = row.original.resultDesc;
      if (!desc)
        return <span className="text-muted-foreground text-xs">—</span>;
      const isSuccess = row.original.status === "SUCCESS";
      return (
        <span
          className={`text-xs ${isSuccess ? "text-green-600" : "text-muted-foreground"}`}
        >
          {desc}
        </span>
      );
    },
  },

  // ── Result code ───────────────────────────────────────────────────────────
  {
    accessorKey: "resultCode",
    header: "Code",
    cell: ({ row }) => {
      const code = row.original.resultCode;
      if (code === null)
        return <span className="text-muted-foreground text-xs">—</span>;
      return (
        <Badge
          variant={code === 0 ? "secondary" : "destructive"}
          className="font-mono text-xs"
        >
          {code}
        </Badge>
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
      <div className="text-xs text-muted-foreground space-y-0.5">
        <p>{format(new Date(row.original.createdAt), "dd MMM yyyy")}</p>
        <p>{format(new Date(row.original.createdAt), "HH:mm:ss")}</p>
      </div>
    ),
  },

  // ── Updated ───────────────────────────────────────────────────────────────
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {format(new Date(row.original.updatedAt), "HH:mm:ss")}
      </span>
    ),
  },
];
