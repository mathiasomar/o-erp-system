// src/components/inventory/columns.tsx

"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { InventoryItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, SlidersHorizontal, History } from "lucide-react";
import { format } from "date-fns";
import { AdjustStockSheet } from "./AdjustStockSheet";
import { StockLogSheet } from "./StockLogSheet";
import { Checkbox } from "../ui/checkbox";
import { usePermissions } from "@/hooks/use-permissions";

const InventoryActionCell = ({ item }: { item: InventoryItem }) => {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const { can } = usePermissions();

  return (
    <>
      <div className="flex items-center gap-1">
        {can("inventory.adjust") && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Adjust stock"
              onClick={() => setAdjustOpen(true)}
            >
              <SlidersHorizontal size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Stock history"
              onClick={() => setLogOpen(true)}
            >
              <History size={14} />
            </Button>
          </>
        )}
      </div>

      {can("inventory.adjust") && (
        <>
          <AdjustStockSheet
            open={adjustOpen}
            onClose={() => setAdjustOpen(false)}
            item={item}
          />
          <StockLogSheet
            open={logOpen}
            onClose={() => setLogOpen(false)}
            item={item}
          />
        </>
      )}
    </>
  );
};

export const inventoryColumns: ColumnDef<InventoryItem>[] = [
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
  {
    accessorKey: "product.name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Product <ArrowUpDown size={14} className="ml-1" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-sm">{row.original.product.name}</p>
        <p className="font-mono text-xs text-muted-foreground">
          {row.original.product.sku}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "product.category.name",
    header: "Category",
    cell: ({ row }) => {
      const cat = row.original.product.category;
      if (!cat) return <span className="text-muted-foreground text-xs">—</span>;
      return (
        <Badge
          style={{ backgroundColor: cat.color ?? "#6b7280" }}
          className="text-white text-xs"
        >
          {cat.name}
        </Badge>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Stock <ArrowUpDown size={14} className="ml-1" />
      </Button>
    ),
    cell: ({ row }) => {
      const qty = row.original.quantity;
      const lowAt = row.original.lowStockAt;
      const isEmpty = qty === 0;
      const isLow = qty > 0 && qty <= lowAt;
      return (
        <Badge
          variant={isEmpty ? "destructive" : isLow ? "outline" : "secondary"}
          className={isLow ? "border-orange-400 text-orange-600" : ""}
        >
          {isEmpty ? "Out of stock" : `${qty} units`}
        </Badge>
      );
    },
  },
  {
    accessorKey: "lowStockAt",
    header: "Alert at",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        ≤ {row.original.lowStockAt} units
      </span>
    ),
  },
  {
    accessorKey: "product.price",
    header: "Price",
    cell: ({ row }) => (
      <span className="text-sm">
        KES {row.original.product.price.toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Last updated <ArrowUpDown size={14} className="ml-1" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {format(new Date(row.original.updatedAt), "dd MMM yyyy")}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <InventoryActionCell item={row.original} />,
  },
];
