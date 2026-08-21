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
  ColumnFiltersState,
  RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Trash2,
  Percent,
  Receipt,
  MoreHorizontal,
  Search,
  BarcodeIcon,
} from "lucide-react";
import { Product } from "@/types";
import { toast } from "sonner";
import { DiscountModal } from "./modals/DiscountModal";
import { TaxModal } from "./modals/TaxModal";
import { PrintBarcodesModal } from "./modals/PrintBarcodeModal";
import { useDeleteProducts } from "@/hooks/use-product";
import { Spinner } from "../ui/spinner";
import { DataTablePagination } from "../DataTablePagination";
import { usePermissions } from "@/hooks/use-permissions";

type Props = {
  data: Product[];
  columns: ColumnDef<Product>[];
};

export function DataTable({ data, columns }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const { mutateAsync: deleteMutate, isPending: isDeleting } =
    useDeleteProducts();

  // modal state
  const [showDelete, setShowDelete] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showTax, setShowTax] = useState(false);
  const [showBarcodes, setShowBarcodes] = useState(false);

  const { can } = usePermissions();

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, rowSelection, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((r) => r.original.id);
  const selectedProducts = selectedRows.map((r) => r.original);
  const hasSelection = selectedIds.length > 0;

  const handleDelete = async () => {
    deleteMutate(selectedIds, {
      onSuccess: () => {
        setRowSelection({});
        toast.success(`${selectedIds.length} product(s) deleted`);
        setShowDelete(false);
      },
    });
  };

  return (
    <div className="space-y-3">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Search */}
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

        {/* Actions menu */}
        <div className="flex items-center gap-2">
          {/* Selection count badge */}
          {hasSelection && (
            <Badge variant="secondary">{selectedIds.length} selected</Badge>
          )}

          {/* Main action menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isDeleting}>
                {isDeleting ? (
                  <Spinner className="w-5 h-5" />
                ) : (
                  <MoreHorizontal size={15} />
                )}
                {isDeleting ? "Deleting..." : "Actions"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Bulk actions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => setShowBarcodes(true)}
                disabled={!hasSelection}
              >
                <BarcodeIcon size={14} className="mr-2" />
                barcodes & tags
                {hasSelection && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {selectedIds.length}
                  </Badge>
                )}
              </DropdownMenuItem>

              {/* Discount + Tax + Delete — ADMIN and MANAGER only */}
              {can("products.edit") && (
                <>
                  <DropdownMenuItem
                    onClick={() => setShowDiscount(true)}
                    disabled={!hasSelection}
                  >
                    <Percent size={14} className="mr-2" /> Apply discount
                    {hasSelection && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {selectedIds.length}
                      </Badge>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setShowTax(true)}
                    disabled={!hasSelection}
                  >
                    <Receipt size={14} className="mr-2" /> Set tax rate
                    {hasSelection && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {selectedIds.length}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                </>
              )}

              {can("products.delete") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowDelete(true)}
                    disabled={!hasSelection}
                  >
                    <Trash2 size={14} className="mr-2" /> Delete selected
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {/* <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft size={14} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft size={14} />
          </Button>
          <span className="px-2">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight size={14} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight size={14} />
          </Button>
        </div>
      </div> */}
      <DataTablePagination table={table} />

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <DiscountModal
        open={showDiscount}
        onClose={() => setShowDiscount(false)}
        selectedIds={selectedIds}
      />
      <TaxModal
        open={showTax}
        onClose={() => setShowTax(false)}
        selectedIds={selectedIds}
      />
      <PrintBarcodesModal
        open={showBarcodes}
        onClose={() => setShowBarcodes(false)}
        products={selectedProducts}
      />

      {/* Delete confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.length} product(s)?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected products and their
              stock records will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Spinner className="mr-2 h-4 w-4" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
