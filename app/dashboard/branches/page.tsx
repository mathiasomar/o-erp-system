"use client";

import { useState } from "react";
import { useBranches } from "@/hooks/use-branches";
import { useQueryClient } from "@tanstack/react-query";
import { Branch } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Plus,
  MoreHorizontal,
  Pencil,
  Star,
  Users,
  ShoppingCart,
  Package,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { setDefaultBranch } from "@/actions/branch.action";
import { BranchSheet } from "@/components/branch/BranchSheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

export default function BranchesPage() {
  const qc = useQueryClient();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | undefined>();

  const { data: branches = [], isLoading } = useBranches();

  const activeBranches = branches.filter((b) => b.isActive).length;
  const totalUsers = branches.reduce((s, b) => s + b._count.users, 0);
  //   const totalOrders = branches.reduce((s, b) => s + b._count.orders, 0);
  const totalProducts = branches.reduce((s, b) => s + b._count.products, 0);

  const handleSetDefault = async (id: string) => {
    const result = await setDefaultBranch(id);
    if (result.success) {
      qc.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Default branch updated");
    } else {
      toast.error("Failed to update default branch");
    }
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditing(undefined);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Branches</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 size={22} /> Branches
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your business locations
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined);
            setSheetOpen(true);
          }}
        >
          <Plus size={14} className="mr-1.5" /> Add Branch
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total branches",
            value: branches.length,
            icon: Building2,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-950/20",
          },
          {
            label: "Active",
            value: activeBranches,
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-950/20",
          },
          {
            label: "Total staff",
            value: totalUsers,
            icon: Users,
            color: "text-purple-600",
            bg: "bg-purple-50 dark:bg-purple-950/20",
          },
          {
            label: "Total products",
            value: totalProducts,
            icon: Package,
            color: "text-orange-600",
            bg: "bg-orange-50 dark:bg-orange-950/20",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-12 mt-1" />
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

      {/* Branch cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Building2 size={32} className="text-muted-foreground/40" />
          <p className="text-muted-foreground">No branches yet</p>
          <Button size="sm" onClick={() => setSheetOpen(true)}>
            <Plus size={13} className="mr-1.5" /> Create your first branch
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <Card key={branch.id} className="relative overflow-hidden">
              {branch.isDefault && (
                <div
                  className="absolute top-0 right-0 bg-primary
                                text-primary-foreground text-[10px]
                                font-bold px-2 py-0.5 rounded-bl-lg"
                >
                  DEFAULT
                </div>
              )}

              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="p-2.5 rounded-xl bg-blue-50
                                    dark:bg-blue-950/20 shrink-0"
                    >
                      <Building2 size={18} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{branch.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {branch.code}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                      >
                        <MoreHorizontal size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(branch);
                          setSheetOpen(true);
                        }}
                      >
                        <Pencil size={13} className="mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/branches/${branch.id}`}>
                          <Eye size={13} className="mr-2" /> View
                        </Link>
                      </DropdownMenuItem>
                      {!branch.isDefault && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleSetDefault(branch.id)}
                          >
                            <Star size={13} className="mr-2" />
                            Set as default
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Status */}
                <Badge
                  variant={branch.isActive ? "default" : "secondary"}
                  className="gap-1"
                >
                  {branch.isActive ? (
                    <>
                      <CheckCircle2 size={10} /> Active
                    </>
                  ) : (
                    <>
                      <XCircle size={10} /> Inactive
                    </>
                  )}
                </Badge>

                {/* Contact */}
                {(branch.address || branch.phone || branch.email) && (
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {branch.address && <p>{branch.address}</p>}
                    {branch.phone && <p>{branch.phone}</p>}
                    {branch.email && <p>{branch.email}</p>}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <div className="text-center">
                    <p
                      className="text-base font-bold flex items-center
                                  justify-center gap-1"
                    >
                      <Users size={12} className="text-muted-foreground" />
                      {branch._count.users}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Staff</p>
                  </div>
                  <div className="text-center">
                    <p
                      className="text-base font-bold flex items-center
                                  justify-center gap-1"
                    >
                      <ShoppingCart
                        size={12}
                        className="text-muted-foreground"
                      />
                      {branch._count.orders}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Orders</p>
                  </div>
                  <div className="text-center">
                    <p
                      className="text-base font-bold flex items-center
                                  justify-center gap-1"
                    >
                      <Package size={12} className="text-muted-foreground" />
                      {branch._count.products}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Products
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BranchSheet open={sheetOpen} onClose={closeSheet} branch={editing} />
    </div>
  );
}
