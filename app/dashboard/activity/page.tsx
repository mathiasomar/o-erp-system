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
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  X,
  Activity,
  FileDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
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
import { BranchLabel } from "@/components/layout/BranchLabel";
import { ScrollArea } from "@/components/ui/scroll-area";

const PAGE_SIZE = 50;

export default function ActivityPage() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("ALL");
  const [entity, setEntity] = useState("ALL");
  const [userId, setUserId] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

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

  const hasFilters =
    search ||
    action !== "ALL" ||
    entity !== "ALL" ||
    userId !== "ALL" ||
    from ||
    to;

  const clearFilters = () => {
    setSearch("");
    setAction("ALL");
    setEntity("ALL");
    setUserId("ALL");
    setFrom("");
    setTo("");
    setPage(1);
  };

  const handleExport = () => {
    if (logs.length === 0) return;
    exportActivityCSV(logs, "activity-log");
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
            <BreadcrumbPage>Activities</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity size={22} /> Activity
          </h1>
          <p className="text-muted-foreground text-sm">
            System-wide activity feed
          </p>
          <BranchLabel />
        </div>
        <div className="flex gap-2">
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
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary row */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="secondary" className="gap-1">
          <Activity size={11} />
          {total.toLocaleString()} activities
        </Badge>
        {!isLoading && logs.length > 0 && (
          <Badge variant="outline">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, total)} of {total}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-56 max-w-sm">
            <Search
              className="absolute left-3 top-2.5 text-muted-foreground"
              size={15}
            />
            <Input
              placeholder="Search activity..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Action filter */}
          <Select
            value={action}
            onValueChange={(v) => {
              setAction(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-48">
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

          {/* Entity filter */}
          <Select
            value={entity}
            onValueChange={(v) => {
              setEntity(v);
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

          {/* User filter */}
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

        {/* Date range */}
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
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center
                            h-48 gap-3 text-muted-foreground"
            >
              <Activity size={32} className="opacity-20" />
              <p className="text-sm">No activity found</p>
            </div>
          ) : (
            <ScrollArea className="divide-y h-90">
              {logs.map((log) => (
                <div key={log.id} className="px-4">
                  <ActivityLogRow log={log} />
                </div>
              ))}
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={14} className="mr-1" /> Prev
            </Button>
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
