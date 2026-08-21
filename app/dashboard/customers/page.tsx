"use client";

import { useState } from "react";
import { Customer } from "@/types";
// import { getCustomerTier } from "@/lib/loyalty";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Users,
  Plus,
  Search,
  Eye,
  Pencil,
  TrendingUp,
  Trophy,
  UserCheck,
} from "lucide-react";
import { format } from "date-fns";
import { useCustomers } from "@/hooks/use-customer";
import { LoyaltyBadge } from "@/components/customer/LoyaltyBadge";
import { CustomerSheet } from "@/components/customer/CustomerSheet";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BranchLabel } from "@/components/layout/BranchLabel";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | undefined>();

  const { data: customers = [], isLoading } = useCustomers(search || undefined);

  const totalPoints = customers.reduce((s, c) => s + c.points, 0);
  const activeCount = customers.filter((c) => c.isActive).length;
  const totalOrders = customers.reduce((s, c) => s + c._count.orders, 0);

  const openEdit = (c: Customer) => {
    setEditing(c);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditing(undefined);
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
            <BreadcrumbPage>Customers</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users size={22} /> Customers
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage customer profiles, history and loyalty points
          </p>
          <BranchLabel />
        </div>
        <Button
          onClick={() => {
            setEditing(undefined);
            setSheetOpen(true);
          }}
        >
          <Plus size={14} className="mr-1.5" /> Add Customer
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total customers",
            value: customers.length,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-950/20",
          },
          {
            label: "Active",
            value: activeCount,
            icon: UserCheck,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-950/20",
          },
          {
            label: "Total orders",
            value: totalOrders,
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-50 dark:bg-purple-950/20",
          },
          {
            label: "Points issued",
            value: totalPoints.toLocaleString(),
            icon: Trophy,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-950/20",
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-2.5 text-muted-foreground"
        />
        <Input
          placeholder="Search name, phone, email..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Loyalty</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c) => {
                // const tier = getCustomerTier(c.points);
                const initials = c.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs font-bold bg-muted">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          {c.notes && (
                            <p className="text-xs text-muted-foreground truncate max-w-32">
                              {c.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        {c.phone && <p>{c.phone}</p>}
                        {c.email && (
                          <p className="text-muted-foreground">{c.email}</p>
                        )}
                        {!c.phone && !c.email && (
                          <p className="text-muted-foreground">—</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <LoyaltyBadge points={c.points} size="sm" />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{c._count.orders}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.isActive ? "default" : "secondary"}>
                        {c.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(c.createdAt), "dd MMM yyyy")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          asChild
                        >
                          <Link href={`/dashboard/customers/${c.id}`}>
                            <Eye size={13} />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil size={13} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CustomerSheet open={sheetOpen} onClose={closeSheet} customer={editing} />
    </div>
  );
}
