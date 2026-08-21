"use client";

import { useState } from "react";
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
  Truck,
  Plus,
  Search,
  Pencil,
  Phone,
  Mail,
  MapPin,
  User,
  Package,
} from "lucide-react";
import { useSuppliers } from "@/hooks/use-supplier";
import { SupplierSheet } from "@/components/supplier/SupplierSheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BranchLabel } from "@/components/layout/BranchLabel";

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<any | undefined>();

  const { data: suppliers = [], isLoading } = useSuppliers();

  const activeCount = suppliers.filter((s) => s.status === "ACTIVE").length;
  const totalPurchases = suppliers.reduce((s, c) => s + c._count.purchases, 0);

  const openEdit = (s: any) => {
    setEditing(s);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditing(undefined);
  };

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  );

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
            <BreadcrumbPage>Suppliers</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck size={22} /> Suppliers
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage supplier profiles and purchase orders
          </p>
          <BranchLabel />
        </div>
        <Button
          onClick={() => {
            setEditing(undefined);
            setSheetOpen(true);
          }}
        >
          <Plus size={14} className="mr-1.5" /> Add Supplier
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total suppliers",
            value: suppliers.length,
            icon: Truck,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-950/20",
          },
          {
            label: "Active",
            value: activeCount,
            icon: User,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-950/20",
          },
          {
            label: "Total purchases",
            value: totalPurchases,
            icon: Package,
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
              <TableHead>Supplier</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Tax PIN</TableHead>
              <TableHead>Purchases</TableHead>
              <TableHead>Status</TableHead>
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
            ) : filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  No suppliers found
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((s) => {
                const initials = s.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs font-bold bg-muted">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{s.name}</p>
                          {s.contactName && (
                            <p className="text-xs text-muted-foreground">
                              Contact: {s.contactName}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        {s.phone && (
                          <p className="flex items-center gap-1">
                            <Phone size={10} /> {s.phone}
                          </p>
                        )}
                        {s.email && (
                          <p className="flex items-center gap-1 text-muted-foreground">
                            <Mail size={10} /> {s.email}
                          </p>
                        )}
                        {!s.phone && !s.email && (
                          <p className="text-muted-foreground">—</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {s.address ? (
                        <p className="text-xs flex items-center gap-1">
                          <MapPin size={10} /> {s.address}
                        </p>
                      ) : (
                        <p className="text-muted-foreground text-xs">—</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono">
                        {s.taxPin || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{s._count.purchases}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.status === "ACTIVE" ? "default" : "secondary"}>
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <SupplierSheet
        open={sheetOpen}
        onClose={closeSheet}
        supplier={editing}
      />
    </div>
  );
}
