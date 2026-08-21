"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingCart,
  Plus,
  Search,
  Package,
  Calendar,
  User,
  Receipt,
  Filter,
  PackageCheck,
  CreditCard,
} from "lucide-react";
import { usePurchases } from "@/hooks/use-purchase";
import { ReceiveInventoryDialog } from "@/components/purchase/ReceiveInventoryDialog";
import { PurchasePaymentDialog } from "@/components/purchase/PurchasePaymentDialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BranchLabel } from "@/components/layout/BranchLabel";
import { format } from "date-fns";
import Link from "next/link";

export default function PurchasesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any | undefined>();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentPurchase, setPaymentPurchase] = useState<any | undefined>();

  const { data: purchases = [], isLoading } = usePurchases(statusFilter, search);

  const totalPurchases = purchases.length;
  const draftCount = purchases.filter((p) => p.status === "DRAFT").length;
  const receivedCount = purchases.filter((p) => p.status === "RECEIVED").length;
  const totalAmount = purchases.reduce((s, p) => s + p.total, 0);

  const openReceive = (p: any) => {
    setSelectedPurchase(p);
    setReceiveOpen(true);
  };

  const closeReceive = () => {
    setReceiveOpen(false);
    setSelectedPurchase(undefined);
  };

  const openPayment = (p: any) => {
    setPaymentPurchase(p);
    setPaymentOpen(true);
  };

  const closePayment = () => {
    setPaymentOpen(false);
    setPaymentPurchase(undefined);
  };

  const filteredPurchases = purchases.filter((p) => {
    const matchesSearch = 
      p.purchaseNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier?.name.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "secondary";
      case "ORDERED": return "default";
      case "PARTIALLY_RECEIVED": return "default";
      case "RECEIVED": return "default";
      case "CANCELLED": return "destructive";
      default: return "secondary";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "PAID": return "default";
      case "PARTIAL": return "secondary";
      case "UNPAID": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Purchases</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart size={22} /> Purchase Orders
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage purchase orders and inventory receiving
          </p>
          <BranchLabel />
        </div>
        <Button asChild>
          <Link href="/dashboard/purchases/add">
            <Plus size={14} className="mr-1.5" /> New Purchase
          </Link>
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total purchases",
            value: totalPurchases,
            icon: ShoppingCart,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-950/20",
          },
          {
            label: "Draft",
            value: draftCount,
            icon: Receipt,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-950/20",
          },
          {
            label: "Received",
            value: receivedCount,
            icon: Package,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-950/20",
          },
          {
            label: "Total value",
            value: `KES ${totalAmount.toLocaleString()}`,
            icon: Receipt,
            color: "text-purple-600",
            bg: "bg-purple-50 dark:bg-purple-950/20",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <p className="text-xl font-bold">{s.value}</p>
                )}
              </div>
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon size={16} className={s.color} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search
            size={14}
            className="absolute left-3 top-2.5 text-muted-foreground"
          />
          <Input
            placeholder="Search PO number, invoice, supplier..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="ORDERED">Ordered</option>
            <option value="PARTIALLY_RECEIVED">Partially Received</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredPurchases.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-muted-foreground"
                >
                  No purchases found
                </TableCell>
              </TableRow>
            ) : (
              filteredPurchases.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{p.purchaseNumber}</p>
                      {p.invoiceNumber && (
                        <p className="text-xs text-muted-foreground">
                          Invoice: {p.invoiceNumber}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{p.supplier?.name || "No supplier"}</p>
                    {p.supplier?.phone && (
                      <p className="text-xs text-muted-foreground">{p.supplier.phone}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs">
                      <Calendar size={12} />
                      {format(new Date(p.createdAt), "MMM d, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Package size={14} />
                      {p._count.items}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      KES {p.total.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(p.status) as any}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant={getPaymentStatusColor(p.paymentStatus) as any}>
                        {p.paymentStatus}
                      </Badge>
                      {p.payments && p.payments.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {p.payments.length} payment(s)
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {p.paymentStatus !== "PAID" && p.status !== "CANCELLED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPayment(p)}
                          title="Record payment"
                        >
                          <CreditCard size={14} />
                        </Button>
                      )}
                      {p.status !== "RECEIVED" && p.status !== "CANCELLED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openReceive(p)}
                          title="Receive inventory"
                        >
                          <PackageCheck size={14} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedPurchase && (
        <ReceiveInventoryDialog
          open={receiveOpen}
          onClose={closeReceive}
          purchaseId={selectedPurchase.id}
          purchaseNumber={selectedPurchase.purchaseNumber}
          items={selectedPurchase.items}
        />
      )}

      {paymentPurchase && (
        <PurchasePaymentDialog
          open={paymentOpen}
          onClose={closePayment}
          purchaseId={paymentPurchase.id}
          purchaseNumber={paymentPurchase.purchaseNumber}
          balanceDue={paymentPurchase.balanceDue}
        />
      )}
    </div>
  );
}
