"use client";
"use no memo";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  RowSelectionState,
  PaginationState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InventoryItem } from "@/types";
import { DataTablePagination } from "../DataTablePagination";
import { BulkAdjustDialog } from "./BulkAdjustDialog";
import { MoreHorizontal, Search, SlidersHorizontal } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

type Props<TData> = {
  data: TData[];
  columns: ColumnDef<TData>[];
};

export function InventoryDataTable<TData extends InventoryItem>({
  data,
  columns,
}: Props<TData>) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "quantity", desc: false },
  ]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [bulkOpen, setBulkOpen] = useState(false);
  const { can } = usePermissions();

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection, globalFilter, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedItems = selectedRows.map((r) => r.original);
  const hasSelection = selectedItems.length > 0;

  return (
    <div className="space-y-3">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-56 max-w-sm">
          <Search
            className="absolute left-3 top-2.5 text-muted-foreground"
            size={15}
          />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {can("inventory.adjust") && hasSelection && (
            <Badge variant="secondary">{selectedItems.length} selected</Badge>
          )}

          {can("inventory.adjust") && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal size={15} className="mr-1" /> Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Bulk actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={!hasSelection}
                  onClick={() => setBulkOpen(true)}
                >
                  <SlidersHorizontal size={14} className="mr-2" />
                  Adjust stock
                  {hasSelection && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {selectedItems.length}
                    </Badge>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No inventory items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      <DataTablePagination table={table} />

      {/* ── Bulk adjust dialog ────────────────────────────────────────────── */}
      <BulkAdjustDialog
        open={bulkOpen}
        onClose={() => {
          setBulkOpen(false);
          setRowSelection({});
        }}
        items={selectedItems}
      />
    </div>
  );
}
