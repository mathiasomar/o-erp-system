"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useOrders } from "@/hooks/use-orders";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { orderColumns } from "@/components/orders/OrderColumns";
import { OrdersDataTable } from "@/components/orders/OrderDatatable";
import { BranchLabel } from "@/components/layout/BranchLabel";

const STATUSES = ["ALL", "PENDING", "COMPLETED", "CANCELLED"];

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const { data: orders = [], isLoading } = useOrders({
    search: search || undefined,
    status: status === "ALL" ? undefined : status,
  });

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Orders</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm">
          View and manage all sales orders
        </p>
        <BranchLabel />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-56 max-w-sm">
          <Search
            className="absolute left-3 top-2.5 text-muted-foreground"
            size={15}
          />
          <Input
            placeholder="Search by order number or M-Pesa ref..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Badge
              key={s}
              variant={status === s ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setStatus(s)}
            >
              {s}
            </Badge>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <OrdersDataTable data={orders} columns={orderColumns} />
      )}
    </div>
  );
}
