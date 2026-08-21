"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Eye, Pencil } from "lucide-react";
import { Product } from "@/types";
import Link from "next/link";
import { useState } from "react";
import { EditProductSheet } from "./EditProductSheet";
import { usePermissions } from "@/hooks/use-permissions";

const ProductActionsCell = ({ product }: { product: Product }) => {
  const [editOpen, setEditOpen] = useState(false);
  const { can } = usePermissions();
  return (
    <>
      <div className="flex items-center gap-1">
        {/* View — all roles */}
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
          <Link href={`/dashboard/products/${product.id}`}>
            <Eye size={14} />
          </Link>
        </Button>
        {/* Edit — ADMIN and MANAGER only */}
        {can("products.edit") && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Edit product"
            onClick={() => setEditOpen(true)}
          >
            <Pencil size={14} />
          </Button>
        )}
      </div>
      {can("products.edit") && (
        <EditProductSheet
          open={editOpen}
          onClose={() => setEditOpen(false)}
          product={product}
        />
      )}
    </>
  );
};

export const columns: ColumnDef<Product>[] = [
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

  // ── Name ──────────────────────────────────────────────────────────────────
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name <ArrowUpDown size={14} className="ml-1" />
      </Button>
    ),
  },

  // ── SKU ───────────────────────────────────────────────────────────────────
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.sku}
      </span>
    ),
  },

  {
    accessorKey: "barcode",
    header: "Barcode",
    cell: ({ row }) => {
      const barcode = row.original.barcode;
      if (!barcode) {
        return (
          <span className="text-muted-foreground text-xs italic">Not set</span>
        );
      }
      return (
        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
          {barcode}
        </span>
      );
    },
  },

  // ── Category ──────────────────────────────────────────────────────────────
  {
    accessorKey: "category.name",
    header: "Category",
    cell: ({ row }) => {
      const cat = row.original.category;
      if (!cat) return <span className="text-muted-foreground text-xs">—</span>;
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

  // ── Price ─────────────────────────────────────────────────────────────────
  {
    accessorKey: "price",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Price <ArrowUpDown size={14} className="ml-1" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">
          KES {row.original.price.toLocaleString()}
        </span>
        {row.original.lastPrice > 0 &&
          row.original.lastPrice !== row.original.price && (
            <span className="text-xs text-muted-foreground">
              KES {row.original.lastPrice.toLocaleString()}
            </span>
          )}
      </div>
    ),
  },

  // ── Stock ─────────────────────────────────────────────────────────────────
  {
    accessorKey: "stock.quantity",
    header: "Stock",
    cell: ({ row }) => {
      const qty = row.original.stock?.quantity ?? 0;
      const lowAt = row.original.stock?.lowStockAt ?? 10;
      const isLow = qty > 0 && qty <= lowAt;
      const isEmpty = qty === 0;
      return (
        <Badge
          variant={isEmpty ? "destructive" : isLow ? "outline" : "secondary"}
          className={
            isLow && !isEmpty ? "border-orange-400 text-orange-600" : ""
          }
        >
          {isEmpty ? "Out of stock" : `${qty} units`}
        </Badge>
      );
    },
  },

  // ── Discount ──────────────────────────────────────────────────────────────
  {
    accessorKey: "discountRate",
    header: "Discount",
    cell: ({ row }) => {
      const d = row.original.discountRate ?? 0;
      return <span className="text-sm">{d > 0 ? `${d}%` : "—"}</span>;
    },
  },

  // ── Tax ───────────────────────────────────────────────────────────────────
  {
    accessorKey: "taxRate",
    header: "Tax",
    cell: ({ row }) => {
      const t = row.original.taxRate ?? 0;
      return <span className="text-sm">{t > 0 ? `${t}%` : "—"}</span>;
    },
  },

  // ── Status ────────────────────────────────────────────────────────────────
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "secondary"}>
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  {
    id: "actions",
    cell: ({ row }) => <ProductActionsCell product={row.original} />,
  },
];
