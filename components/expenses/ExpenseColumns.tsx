// src/components/expenses/columns.tsx

"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Expense } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowUpDown,
  Pencil,
  Banknote,
  Smartphone,
  CreditCard,
  Building2,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { ExpenseSheet } from "./ExpenseSheet";
import { Avatar, AvatarFallback } from "../ui/avatar";

const methodConfig: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    color: string;
  }
> = {
  CASH: { label: "Cash", icon: Banknote, color: "text-green-600" },
  MPESA: { label: "M-Pesa", icon: Smartphone, color: "text-blue-600" },
  CARD: { label: "Card", icon: CreditCard, color: "text-purple-600" },
  BANK_TRANSFER: {
    label: "Bank transfer",
    icon: Building2,
    color: "text-orange-600",
  },
};

const frequencyLabel: Record<string, string> = {
  ONE_TIME: "One-time",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export const expenseColumns: ColumnDef<Expense>[] = [
  // ── Select ────────────────────────────────────────────────────────────────
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // ── Title ─────────────────────────────────────────────────────────────────
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Title <ArrowUpDown size={14} className="ml-1" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-sm">{row.original.title}</p>
        {row.original.note && (
          <p className="text-xs text-muted-foreground truncate max-w-48">
            {row.original.note}
          </p>
        )}
      </div>
    ),
  },

  {
    accessorKey: "user.name",
    header: "Created By",
    cell: ({ row }) => {
      const user = row.original.user;
      if (!user)
        return <span className="text-muted-foreground text-xs">Unknown</span>;
      const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] font-medium bg-muted">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs font-medium leading-tight">{user.name}</p>
            <p className="text-[10px] text-muted-foreground">{user.role}</p>
          </div>
        </div>
      );
    },
  },

  // ── Category ──────────────────────────────────────────────────────────────
  {
    accessorKey: "category.name",
    header: "Category",
    cell: ({ row }) => {
      const cat = row.original.category;
      if (!cat)
        return (
          <span className="text-muted-foreground text-xs">Uncategorised</span>
        );
      return (
        <Badge
          style={{ backgroundColor: cat.color ?? "#6b7280" }}
          className="text-white"
        >
          {cat.name}
        </Badge>
      );
    },
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
      <span className="font-semibold text-destructive">
        − KES {row.original.amount.toLocaleString()}
      </span>
    ),
  },

  // ── Payment method ────────────────────────────────────────────────────────
  {
    accessorKey: "paymentMethod",
    header: "Method",
    cell: ({ row }) => {
      const cfg = methodConfig[row.original.paymentMethod];
      const Icon = cfg?.icon;
      return (
        <div className={`flex items-center gap-1.5 text-sm ${cfg?.color}`}>
          {Icon && <Icon size={13} />}
          {cfg?.label}
        </div>
      );
    },
  },

  // ── Frequency ─────────────────────────────────────────────────────────────
  {
    accessorKey: "frequency",
    header: "Frequency",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <Badge variant={row.original.isRecurring ? "default" : "secondary"}>
          {frequencyLabel[row.original.frequency]}
        </Badge>
      </div>
    ),
  },

  // ── Date ──────────────────────────────────────────────────────────────────
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date <ArrowUpDown size={14} className="ml-1" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {format(new Date(row.original.date), "dd MMM yyyy")}
      </span>
    ),
  },

  // ── Receipt ───────────────────────────────────────────────────────────────
  {
    accessorKey: "receiptUrl",
    header: "Receipt",
    cell: ({ row }) =>
      row.original.receiptUrl ? (
        <a
          href={row.original.receiptUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-primary underline"
        >
          View <ExternalLink size={10} />
        </a>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      ),
  },

  // ── Actions ───────────────────────────────────────────────────────────────
  {
    id: "actions",
    cell: ({ row }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [editOpen, setEditOpen] = useState(false);
      return (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setEditOpen(true)}
          >
            <Pencil size={13} />
          </Button>
          <ExpenseSheet
            open={editOpen}
            onClose={() => setEditOpen(false)}
            expense={row.original}
          />
        </>
      );
    },
  },
];
