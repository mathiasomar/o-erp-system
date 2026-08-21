"use client";

import { useState } from "react";
import { useActivity } from "@/hooks/use-activity";
import { ActivityLogRow } from "@/components/activity/ActivityLogRow";
import { exportActivityCSV } from "@/lib/export/activity-csv";
import {
  ACTION_TYPES,
  ENTITY_TYPES,
  ACTION_CONFIG,
} from "@/lib/activity-config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import {
  Logs,
  Search,
  X,
  FileDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  Users,
  Settings,
} from "lucide-react";
import { useUsers } from "@/hooks/use-user";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const PAGE_SIZE = 100;

// ── quick filter presets ──────────────────────────────────────────────────────
const PRESETS = [
  { label: "All", action: "ALL", entity: "ALL" },
  { label: "Orders", action: "ALL", entity: "Order" },
  { label: "Products", action: "ALL", entity: "Product" },
  { label: "Users", action: "ALL", entity: "User" },
  { label: "Settings", action: "SETTINGS_UPDATED", entity: "ALL" },
  { label: "Permissions", action: "PERMISSIONS_UPDATED", entity: "ALL" },
  { label: "Logins", action: "USER_LOGIN", entity: "ALL" },
];

export default function LogsPage() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("ALL");
  const [entity, setEntity] = useState("ALL");
  const [userId, setUserId] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [preset, setPreset] = useState("All");

  const qc = useQueryClient();
  const { data: users = [] } = useUsers();

  const filters = {
    search: search || undefined,
    action: action !== "ALL" ? action : undefined,
    entity: entity !== "ALL" ? entity : undefined,
    userId: userId !== "ALL" ? userId : undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading } = useActivity(filters);
  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const pages = Math.ceil(total / PAGE_SIZE);

  const applyPreset = (p: (typeof PRESETS)[0]) => {
    setPreset(p.label);
    setAction(p.action);
    setEntity(p.entity);
    setSearch("");
    setUserId("ALL");
    setFrom("");
    setTo("");
    setPage(1);
  };

  const clearFilters = () => {
    applyPreset(PRESETS[0]);
  };

  const hasFilters =
    search ||
    action !== "ALL" ||
    entity !== "ALL" ||
    userId !== "ALL" ||
    from ||
    to;

  const handleExport = () => {
    if (logs.length === 0) return;
    exportActivityCSV(logs, `system-logs-page${page}`);
  };

  // ── stats ──────────────────────────────────────────────────────────────────
  const loginCount = logs.filter((l) => l.action === "USER_LOGIN").length;
  const settingCount = logs.filter(
    (l) =>
      l.action === "SETTINGS_UPDATED" || l.action === "PERMISSIONS_UPDATED",
  ).length;

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
            <BreadcrumbPage>System Logs</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Logs size={22} /> System Logs
          </h1>
          <p className="text-muted-foreground text-sm">
            Complete audit trail — visible to admins only
          </p>
        </div>
        <div className="flex gap-2">
          <Badge
            variant="outline"
            className="gap-1 text-red-500 border-red-300"
          >
            <Shield size={11} /> Admin only
          </Badge>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => qc.invalidateQueries({ queryKey: ["activity"] })}
          >
            <RefreshCw size={14} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={logs.length === 0}
            onClick={handleExport}
          >
            <FileDown size={14} className="mr-1.5" />
            Export page
          </Button>
        </div>
      </div>

      {/* Quick stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total logs",
            value: total.toLocaleString(),
            icon: Activity,
            color: "text-muted-foreground",
            bg: "bg-muted",
          },
          {
            label: "This page",
            value: String(logs.length),
            icon: Logs,
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-950/20",
          },
          {
            label: "Logins",
            value: String(loginCount),
            icon: Users,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-950/20",
          },
          {
            label: "Setting changes",
            value: String(settingCount),
            icon: Settings,
            color: "text-orange-500",
            bg: "bg-orange-50 dark:bg-orange-950/20",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-16 mt-1" />
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

      {/* Quick preset filters */}
      <div className="flex gap-2 flex-wrap">
        {PRESETS.map((p) => (
          <Badge
            key={p.label}
            variant={preset === p.label ? "default" : "outline"}
            className="cursor-pointer select-none"
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </Badge>
        ))}
      </div>

      <Separator />

      {/* Advanced filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-56 max-w-sm">
            <Search
              className="absolute left-3 top-2.5 text-muted-foreground"
              size={15}
            />
            <Input
              placeholder="Search logs..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <Select
            value={action}
            onValueChange={(v) => {
              setAction(v);
              setPreset("");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem value="ALL">All actions</SelectItem>
              {ACTION_TYPES.map((a) => (
                <SelectItem key={a} value={a}>
                  {ACTION_CONFIG[a]?.label ?? a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={entity}
            onValueChange={(v) => {
              setEntity(v);
              setPreset("");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All entities</SelectItem>
              {ENTITY_TYPES.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={userId}
            onValueChange={(v) => {
              setUserId(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All users</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={clearFilters}
            >
              <X size={13} className="mr-1" /> Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Date range:</span>
          <Input
            type="date"
            className="w-40 text-sm"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            className="w-40 text-sm"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Log list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {total.toLocaleString()} total entries · showing page {page} of{" "}
            {pages || 1}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center
                            h-48 gap-3 text-muted-foreground"
            >
              <Logs size={32} className="opacity-20" />
              <p className="text-sm">No logs found</p>
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log) => (
                <div key={log.id} className="px-4">
                  <ActivityLogRow log={log} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}{" "}
            entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={14} className="mr-1" /> Prev
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {page} / {pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
