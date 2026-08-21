"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Pencil } from "lucide-react";
import { ProductDetails } from "@/components/products/view/ProductDetails";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useState } from "react";
import { EditProductSheet } from "@/components/products/EditProductSheet";
import { StockCard } from "@/components/products/view/StockCard";
import { useProduct } from "@/hooks/use-product";
import { usePermissions } from "@/hooks/use-permissions";

export default function ProductViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const { data: product, isLoading } = useProduct(id);

  const { can } = usePermissions();

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-120 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-120 rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Not found ───────────────────────────────────────────────────────────
  if (!product) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-96 gap-3">
        <p className="text-muted-foreground text-sm">Product not found.</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft size={14} className="mr-1.5" /> Go back
        </Button>
      </div>
    );
  }

  // ── Page ────────────────────────────────────────────────────────────────
  return (
    <div className="p-2 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/products">Products</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon">
            <Link href="/dashboard/products">
              <ArrowLeft size={14} />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold leading-tight">
                {product.name}
              </h1>
              <Badge variant={product.isActive ? "default" : "secondary"}>
                {product.isActive ? "Active" : "Inactive"}
              </Badge>
              {product.category && (
                <Badge
                  style={{
                    backgroundColor: product.category.color ?? "#6b7280",
                  }}
                  className="text-white"
                >
                  {product.category.name}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm font-mono mt-0.5">
              {product.sku}
            </p>
          </div>
        </div>

        {can("products.edit") && (
          <Button onClick={() => setEditOpen(true)}>
            <Pencil size={14} className="mr-1.5" /> Edit Product
          </Button>
        )}
      </div>

      <Separator />

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance placeholder — takes 2/3 width on large screens */}
        <div className="lg:col-span-2">
          <StockCard product={product} />
        </div>

        {/* Product details — takes 1/3 width */}
        <div>
          <ProductDetails product={product} />
        </div>
      </div>

      {/* Edit sheet */}
      {can("products.edit") && product && (
        <EditProductSheet
          open={editOpen}
          onClose={() => setEditOpen(false)}
          product={product}
        />
      )}
    </div>
  );
}
