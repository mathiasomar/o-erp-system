"use client";

import { AddCategorySheet } from "@/components/categories/AddCategorySheet";
import { categoryColumns } from "@/components/categories/CategoryColumns";
import { CategoryDataTable } from "@/components/categories/CategoryDatatable";
import { BranchLabel } from "@/components/layout/BranchLabel";
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
import { useCategories } from "@/hooks/use-category";
import { Plus } from "lucide-react";
import { useState } from "react";

const CategoriesPage = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: categories = [], isLoading } = useCategories();
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
            <BreadcrumbPage>Categories</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground text-sm">
            Organise your products into categories for easier navigation
          </p>
          <BranchLabel />
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus size={15} className="mr-1" /> Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <CategoryDataTable data={categories} columns={categoryColumns} />
      )}

      <AddCategorySheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
};

export default CategoriesPage;
