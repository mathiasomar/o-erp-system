"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, LucideIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type DateRange = { from?: string; to?: string };

type ExportOption = {
  label: string;
  format: "xlsx" | "pdf" | "json";
  icon: LucideIcon;
  color: string;
  disabled?: boolean;
  onClick: (range: DateRange, extra?: Record<string, string>) => void;
};

type Props = {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  badge?: string;
  options: ExportOption[];
  showDates?: boolean;
  showStatus?: boolean;
  loading: boolean;
};

export const ExportCard = ({
  title,
  description,
  icon: Icon,
  iconColor,
  iconBg,
  badge,
  options,
  showDates = true,
  showStatus = false,
  loading,
}: Props) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("ALL");

  const range = { from: from || undefined, to: to || undefined };
  const extra = showStatus ? { status } : undefined;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl", iconBg)}>
              <Icon size={18} className={iconColor} />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {description}
              </CardDescription>
            </div>
          </div>
          {badge && (
            <Badge variant="outline" className="text-[10px] shrink-0">
              {badge}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {/* Date range */}
        {showDates && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Date range (optional)
            </p>
            <div className="flex gap-2">
              <Input
                type="date"
                className="text-xs h-8 flex-1"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <span className="text-muted-foreground text-xs self-center">
                to
              </span>
              <Input
                type="date"
                className="text-xs h-8 flex-1"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Status filter */}
        {showStatus && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Status filter
            </p>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Separator />

        {/* Export buttons */}
        <div className="space-y-2">
          {options.map((opt) => (
            <Button
              key={opt.label}
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 h-9"
              disabled={loading || opt.disabled}
              onClick={() => opt.onClick(range, extra)}
            >
              {loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <opt.icon size={13} className={opt.color} />
              )}
              {opt.label}
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {opt.format.toUpperCase()}
              </Badge>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
