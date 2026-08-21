"use client";

import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
} from "lucide-react";
import { useInventory, useLowStock } from "@/hooks/use-inventory";
import { InventoryDataTable } from "@/components/inventory/InventoryDatatable";
import { inventoryColumns } from "@/components/inventory/InventoryColums";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BranchLabel } from "@/components/layout/BranchLabel";

export default function InventoryPage() {
  const searchParams = useSearchParams();
  const filterLow = searchParams.get("filter") === "low";
  const { data: allItems = [], isLoading } = useInventory();
  const { data: lowItems = [] } = useLowStock();

  const outOfStock = allItems.filter((i) => i.quantity === 0).length;
  const lowStock = allItems.filter(
    (i) => i.quantity > 0 && i.quantity <= i.lowStockAt,
  ).length;
  const healthy = allItems.filter((i) => i.quantity > i.lowStockAt).length;
  const displayData = filterLow ? lowItems : allItems;

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Inventory</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-muted-foreground text-sm">
          Track and manage stock levels across all products
        </p>
        <BranchLabel />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Package size={20} className="text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Total products</p>
              <p className="text-xl font-bold">{allItems.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-600 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Healthy stock</p>
              <p className="text-xl font-bold text-green-600">{healthy}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle size={20} className="text-orange-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Low stock</p>
              <p className="text-xl font-bold text-orange-500">{lowStock}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingDown size={20} className="text-destructive shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Out of stock</p>
              <p className="text-xl font-bold text-destructive">{outOfStock}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter indicator */}
      {filterLow && (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-orange-400 text-orange-600"
          >
            Showing low stock only
          </Badge>
          <a
            href="/dashboard/inventory"
            className="text-xs text-muted-foreground underline"
          >
            Show all
          </a>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <InventoryDataTable data={displayData} columns={inventoryColumns} />
      )}
    </div>
  );
}
