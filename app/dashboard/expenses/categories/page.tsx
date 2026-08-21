"use client";
"use no memo";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ExpenseCategoryWithCount } from "@/types";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
  ArrowUpDown,
} from "lucide-react";
import { format } from "date-fns";
import { DataTablePagination } from "@/components/DataTablePagination";
import { useExpenseCategories } from "@/hooks/use-expense";
import { deleteExpenseCategory } from "@/actions/expense.action";
import { AddExpenseCategorySheet } from "@/components/expenses/categories/AddExpenseCategorySheet";
import { EditExpenseCategorySheet } from "@/components/expenses/categories/EditExpenseCategorySheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BranchLabel } from "@/components/layout/BranchLabel";

export default function ExpenseCategoriesPage() {
  const qc = useQueryClient();
  const { data: categories = [], isLoading } = useExpenseCategories();

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<ExpenseCategoryWithCount | null>(
    null,
  );
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // ── columns ────────────────────────────────────────────────────────────────

  const columns: ColumnDef<ExpenseCategoryWithCount>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          ref={(el) => {
            if (el) el.indeterminate = table.getIsSomePageRowsSelected();
          }}
          onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
          className="h-4 w-4 rounded border"
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          className="h-4 w-4 rounded border"
          aria-label="Select row"
        />
      ),
      enableSorting: false,
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
      accessorKey: "_count.expenses",
      header: "Expenses",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original._count.expenses}{" "}
          {row.original._count.expenses !== 1 ? "expenses" : "expense"}
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
          {format(new Date(row.original.createdAt), "dd MMM yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setEditItem(row.original)}
          >
            <Pencil size={13} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => setDeleteIds([row.original.id])}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: categories,
    columns,
    state: { sorting, rowSelection, globalFilter },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const selectedIds = table
    .getFilteredSelectedRowModel()
    .rows.map((r) => r.original.id);
  const hasSelection = selectedIds.length > 0;

  async function handleDelete() {
    setDeleting(true);
    try {
      await Promise.all(deleteIds.map((id) => deleteExpenseCategory(id)));
      qc.invalidateQueries({ queryKey: ["expense-categories"] });
      toast.success(`${deleteIds.length} category(s) deleted`);
      setRowSelection({});
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
      setDeleteIds([]);
    }
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/expenses">Expenses</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Expenses Categories</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Expense Categories</h1>
          <p className="text-muted-foreground text-sm">
            Organise your expenses into categories
          </p>
          <BranchLabel />
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={15} className="mr-1.5" /> Add Category
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-56 max-w-sm">
          <Search
            className="absolute left-3 top-2.5 text-muted-foreground"
            size={15}
          />
          <Input
            placeholder="Search categories..."
            className="pl-9"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {hasSelection && (
            <Badge variant="secondary">{selectedIds.length} selected</Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal size={15} className="mr-1" /> Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Bulk actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                disabled={!hasSelection}
                onClick={() => setDeleteIds(selectedIds)}
              >
                <Trash2 size={14} className="mr-2" />
                Delete selected
                {hasSelection && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {selectedIds.length}
                  </Badge>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>
                        {h.isPlaceholder
                          ? null
                          : flexRender(
                              h.column.columnDef.header,
                              h.getContext(),
                            )}
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
                      No categories yet. Add one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <DataTablePagination table={table} />
        </div>
      )}

      {/* Sheets */}
      <AddExpenseCategorySheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
      {editItem && (
        <EditExpenseCategorySheet
          open={!!editItem}
          onClose={() => setEditItem(null)}
          category={editItem}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteIds.length > 0}
        onOpenChange={(o) => {
          if (!o) setDeleteIds([]);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteIds.length} category(s)?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Expenses in these categories will become uncategorised but will
              not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteIds([])}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
