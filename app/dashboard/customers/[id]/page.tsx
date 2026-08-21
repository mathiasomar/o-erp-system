"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCustomer } from "@/hooks/use-customer";
import { useQueryClient } from "@tanstack/react-query";
import { getCustomerTier, KES_PER_POINT } from "@/lib/loyalty";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  ArrowLeft,
  Pencil,
  Trophy,
  Phone,
  Mail,
  MapPin,
  FileText,
  ShoppingCart,
  TrendingUp,
  CheckCircle2,
  UserX,
  UserCheck,
  Plus,
  Minus,
  Loader2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  adjustLoyaltyPoints,
  toggleCustomerStatus,
} from "@/actions/customer.action";
import { LoyaltyBadge } from "@/components/customer/LoyaltyBadge";
import { CustomerSheet } from "@/components/customer/CustomerSheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: customer, isLoading } = useCustomer(id);

  const [editOpen, setEditOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [pointsInput, setPointsInput] = useState("");
  const [pointsLoading, setPointsLoading] = useState(false);

  const totalSpend =
    customer?.orders
      .filter((o) => o.status === "COMPLETED")
      .reduce((s, o) => s + o.total, 0) ?? 0;

  const handleAdjustPoints = async (sign: 1 | -1) => {
    const n = parseInt(pointsInput, 10);
    if (isNaN(n) || n <= 0) {
      toast.error("Enter a valid number of points");
      return;
    }
    setPointsLoading(true);
    const result = await adjustLoyaltyPoints(
      id,
      sign * n,
      sign === 1 ? "Manual points addition" : "Manual points deduction",
    );
    if (result.success) {
      qc.invalidateQueries({ queryKey: ["customer", id] });
      toast.success(`Points ${sign === 1 ? "added" : "deducted"} successfully`);
      setPointsInput("");
    } else {
      toast.error(result.error ?? "Failed to adjust points");
    }
    setPointsLoading(false);
  };

  const handleToggleStatus = async () => {
    const result = await toggleCustomerStatus(id);
    if (result.success) {
      qc.invalidateQueries({ queryKey: ["customer", id] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success(
        result.isActive ? "Customer activated" : "Customer deactivated",
      );
    }
    setStatusDialog(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div
        className="p-6 flex flex-col items-center h-96
                      justify-center gap-3"
      >
        <p className="text-muted-foreground">Customer not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft size={14} className="mr-1.5" /> Go back
        </Button>
      </div>
    );
  }

  const tier = getCustomerTier(customer.points);
  const initials = customer.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-4 space-y-6 mx-auto">
      {/* Header */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/customers">
              Customers
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{customer.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft size={16} />
          </Button>
          <Avatar className="h-14 w-14">
            <AvatarFallback
              className="text-xl font-bold"
              style={{ backgroundColor: tier.color + "30", color: tier.color }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{customer.name}</h1>
              <Badge variant={customer.isActive ? "default" : "secondary"}>
                {customer.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <LoyaltyBadge points={customer.points} showNext />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className={
              customer.isActive
                ? "text-destructive border-destructive/40 hover:bg-destructive/10"
                : "text-green-600 border-green-300"
            }
            onClick={() => setStatusDialog(true)}
          >
            {customer.isActive ? (
              <>
                <UserX size={13} className="mr-1.5" /> Deactivate
              </>
            ) : (
              <>
                <UserCheck size={13} className="mr-1.5" /> Activate
              </>
            )}
          </Button>
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil size={13} className="mr-1.5" /> Edit
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total orders",
            value: customer._count.orders,
            icon: ShoppingCart,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-950/20",
          },
          {
            label: "Total spend",
            value: `KES ${totalSpend.toLocaleString()}`,
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-950/20",
          },
          {
            label: "Loyalty points",
            value: customer.points.toLocaleString(),
            icon: Trophy,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-950/20",
          },
          {
            label: "Avg order value",
            value:
              customer._count.orders > 0
                ? `KES ${(totalSpend / customer._count.orders).toFixed(0)}`
                : "—",
            icon: CheckCircle2,
            color: "text-purple-600",
            bg: "bg-purple-50 dark:bg-purple-950/20",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold leading-tight">{s.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon size={16} className={s.color} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — purchase history */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recent orders */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart size={15} /> Purchase History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {customer.orders.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center
                                h-32 gap-2 text-muted-foreground text-sm"
                >
                  <ShoppingCart size={20} className="opacity-30" />
                  No orders yet
                </div>
              ) : (
                <div className="divide-y">
                  {customer.orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between
                                 px-4 py-3 gap-3 cursor-pointer
                                 hover:bg-muted/40 transition-colors"
                      onClick={() =>
                        router.push(`/dashboard/orders/${order.id}`)
                      }
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-mono font-medium">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.items.length} item
                          {order.items.length !== 1 ? "s" : ""} ·{" "}
                          {format(
                            new Date(order.createdAt),
                            "dd MMM yyyy HH:mm",
                          )}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">
                          KES {order.total.toLocaleString()}
                        </p>
                        <Badge
                          variant={
                            order.status === "COMPLETED"
                              ? "default"
                              : order.status === "CANCELLED"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loyalty log */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy size={15} /> Points History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {customer.pointLogs.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center
                                h-24 gap-2 text-muted-foreground text-sm"
                >
                  <Trophy size={18} className="opacity-30" />
                  No points activity
                </div>
              ) : (
                <ScrollArea className="max-h-56">
                  <div className="divide-y">
                    {customer.pointLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between
                                   px-4 py-2.5 gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium">
                            {log.description ?? log.type}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(log.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <span
                          className={`text-sm font-bold shrink-0 ${
                            log.points >= 0
                              ? "text-green-600"
                              : "text-destructive"
                          }`}
                        >
                          {log.points >= 0 ? "+" : ""}
                          {log.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Contact info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              {[
                { icon: Phone, label: "Phone", value: customer.phone },
                { icon: Mail, label: "Email", value: customer.email },
                { icon: MapPin, label: "Address", value: customer.address },
                { icon: FileText, label: "Notes", value: customer.notes },
              ].map(
                (row) =>
                  row.value && (
                    <div key={row.label} className="flex items-start gap-2.5">
                      <row.icon
                        size={13}
                        className="text-muted-foreground shrink-0 mt-0.5"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground">
                          {row.label}
                        </p>
                        <p className="text-sm bwrap-reak-words">{row.value}</p>
                      </div>
                    </div>
                  ),
              )}
              <Separator />
              <p className="text-[10px] text-muted-foreground">
                Customer since{" "}
                {format(new Date(customer.createdAt), "dd MMM yyyy")}
              </p>
            </CardContent>
          </Card>

          {/* Points adjustment */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy size={14} className="text-amber-500" />
                Adjust Points
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                1 point earned per KES {KES_PER_POINT} spent. Current balance:{" "}
                <span className="font-bold text-foreground">
                  {customer.points} pts
                </span>
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  placeholder="Points"
                  className="h-8 text-sm"
                  value={pointsInput}
                  onChange={(e) => setPointsInput(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-green-600 border-green-200
                             hover:bg-green-50"
                  disabled={pointsLoading || !pointsInput}
                  onClick={() => handleAdjustPoints(1)}
                >
                  {pointsLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Plus size={12} className="mr-1" />
                  )}
                  Add
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-destructive border-destructive/30
                             hover:bg-destructive/10"
                  disabled={pointsLoading || !pointsInput}
                  onClick={() => handleAdjustPoints(-1)}
                >
                  {pointsLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Minus size={12} className="mr-1" />
                  )}
                  Deduct
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit sheet */}
      <CustomerSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        customer={customer}
      />

      {/* Status dialog */}
      <AlertDialog open={statusDialog} onOpenChange={setStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {customer.isActive ? "Deactivate" : "Activate"} {customer.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {customer.isActive
                ? "This customer will be hidden from the POS search."
                : "This customer will appear in POS search again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={
                customer.isActive
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-green-600 hover:bg-green-700"
              }
              onClick={handleToggleStatus}
            >
              {customer.isActive ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
