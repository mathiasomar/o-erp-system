"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Pencil } from "lucide-react";
import { EditCategorySheet } from "./EditCategorySheet";
import { useState } from "react";

type CategoryRow = {
  id: string;
  name: string;
  color: string | null;
  _count: { products: number };
  createdAt: string;
};

export const categoryColumns: ColumnDef<CategoryRow>[] = [
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
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name <ArrowUpDown size={14} className="ml-1" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: row.original.color ?? "#6b7280" }}
        />
        <span className="font-medium">{row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: "color",
    header: "Color",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded border"
          style={{ backgroundColor: row.original.color ?? "#6b7280" }}
        />
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.color ?? "—"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "_count.products",
    header: "Products",
    cell: ({ row }) => (
      <Badge variant="secondary">
        {row.original._count.products} product
        {row.original._count.products !== 1 ? "s" : ""}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created <ArrowUpDown size={14} className="ml-1" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleDateString("en-KE", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </span>
    ),
  },
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
            title="Edit category"
            onClick={() => setEditOpen(true)}
          >
            <Pencil size={14} />
          </Button>

          <EditCategorySheet
            open={editOpen}
            onClose={() => setEditOpen(false)}
            category={row.original}
          />
        </>
      );
    },
  },
];
