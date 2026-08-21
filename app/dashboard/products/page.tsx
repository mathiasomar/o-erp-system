"use client";

import { BranchLabel } from "@/components/layout/BranchLabel";
import { AddProductSheet } from "@/components/products/AddProductSheet";
import { ImportProductsDialog } from "@/components/products/ImportProductDialog";
import { columns } from "@/components/products/ProductColumns";
import { DataTable } from "@/components/products/ProductDatatable";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/hooks/use-permissions";
import { useAllProducts } from "@/hooks/use-product";
import { Plus, Upload } from "lucide-react";
import { useState } from "react";

const ProductsPage = () => {
  const { data: products = [], isLoading } = useAllProducts();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { can } = usePermissions();
  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Products</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm">
            Manage your product catalog, pricing and inventory
          </p>
          <BranchLabel />
        </div>
        {/* Only ADMIN and MANAGER see Add Product */}
        {can("products.create") && (
          <div className="flex gap-2">
            <Button onClick={() => setSheetOpen(true)}>
              <Plus size={15} className="mr-1" /> Add Product
            </Button>

            {/* Import button */}
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload size={14} className="mr-1.5" />
              Import
            </Button>
          </div>
        )}
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <DataTable data={products} columns={columns} />
      )}

      {can("products.create") && (
        <>
          <AddProductSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
          />
          <ImportProductsDialog
            open={importOpen}
            onClose={() => setImportOpen(false)}
          />
        </>
      )}
    </div>
  );
};

export default ProductsPage;
