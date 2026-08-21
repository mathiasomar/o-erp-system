"use client";

import { useState } from "react";
import { userColumns } from "@/components/users/UserColumns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users, Shield, Briefcase, User } from "lucide-react";
import { useUsers } from "@/hooks/use-user";
import { UsersDataTable } from "@/components/users/UserDatatable";
import { UserSheet } from "@/components/users/UserSheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function UsersPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: users = [], isLoading } = useUsers();

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const managerCount = users.filter((u) => u.role === "MANAGER").length;
  const cashierCount = users.filter((u) => u.role === "CASHIER").length;
  const activeCount = users.filter((u) => u.isActive).length;

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
            <BreadcrumbPage>users</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm">
            Manage user accounts and access control
          </p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus size={15} className="mr-1.5" /> Add User
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total users</p>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-xs text-muted-foreground">
                {activeCount} active
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted">
              <Users size={18} className="text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Admins</p>
              <p className="text-2xl font-bold text-red-500">{adminCount}</p>
              <p className="text-xs text-muted-foreground">Full access</p>
            </div>
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
              <Shield size={18} className="text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Managers</p>
              <p className="text-2xl font-bold text-blue-500">{managerCount}</p>
              <p className="text-xs text-muted-foreground">Limited access</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <Briefcase size={18} className="text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Cashiers</p>
              <p className="text-2xl font-bold text-green-500">
                {cashierCount}
              </p>
              <p className="text-xs text-muted-foreground">POS only</p>
            </div>
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
              <User size={18} className="text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <UsersDataTable data={users} columns={userColumns} />
      )}

      <UserSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
