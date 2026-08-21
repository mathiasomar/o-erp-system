"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Order } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Banknote, CreditCard, Eye, Smartphone } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
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
};

const statusVariant = (s: string) =>
  s === "COMPLETED"
    ? "default"
    : s === "CANCELLED"
      ? "destructive"
      : "secondary";

// const methodLabel: Record<string, string> = {
//   CASH: "Cash",
//   MPESA: "M-Pesa",
//   CARD: "Card",
// };

export const orderColumns: ColumnDef<Order>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-medium">
        {row.original.orderNumber}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={statusVariant(row.original.status)}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "user.name",
    header: "Cashier",
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
  {
    accessorKey: "payment.method",
    header: "Payment",
    cell: ({ row }) => {
      const splits = row.original.payment?.splitPayments ?? [];
      if (splits.length === 0) {
        return <span className="text-muted-foreground text-xs">—</span>;
      }
      if (splits.length === 1) {
        const cfg = methodConfig[splits[0].method];
        const Icon = cfg?.icon;
        return (
          <div className={`flex items-center gap-1.5 text-sm ${cfg?.color}`}>
            {Icon && <Icon size={13} />}
            {cfg?.label}
          </div>
        );
      }
      // Split payment — show badges
      return (
        <div className="flex flex-wrap gap-1">
          {splits.map((sp, i) => {
            const cfg = methodConfig[sp.method];
            return (
              <span
                key={i}
                className={`text-[10px] font-medium ${cfg?.color ?? ""}`}
              >
                {cfg?.label ?? sp.method}
              </span>
            );
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.items.length} item
        {row.original.items.length !== 1 ? "s" : ""}
      </span>
    ),
  },
  {
    accessorKey: "total",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Total <ArrowUpDown size={14} className="ml-1" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-semibold">
        KES {row.original.total.toLocaleString()}
      </span>
    ),
  },
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
      <span className="text-sm text-muted-foreground">
        {format(new Date(row.original.createdAt), "dd MMM yyyy, HH:mm")}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
          <Link href={`/dashboard/orders/${row.original.id}`}>
            <Eye size={14} />
          </Link>
        </Button>
      );
    },
  },
];
