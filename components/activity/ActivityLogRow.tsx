import { ActivityLog } from "@/types";
import { ACTION_CONFIG } from "@/lib/activity-config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

type Props = {
  log: ActivityLog;
  compact?: boolean;
};

export const ActivityLogRow = ({ log, compact = false }: Props) => {
  const cfg = ACTION_CONFIG[log.action] ?? {
    label: log.action,
    color: "text-muted-foreground",
    bg: "bg-muted/40",
    icon: null,
    entity: log.entity,
  };
  const Icon = cfg.icon;
  const initials =
    log.user?.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?";

  return (
    <div
      className={cn(
        "flex items-start gap-3 py-3",
        !compact && "border-b last:border-0",
      )}
    >
      {/* Action icon */}
      <div className={cn("p-2 rounded-lg shrink-0 mt-0.5", cfg.bg)}>
        {Icon && <Icon size={13} className={cfg.color} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-sm font-medium", cfg.color)}>
            {cfg.label}
          </span>
          {log.entityLabel && (
            <span className="text-sm text-foreground font-semibold truncate">
              — {log.entityLabel}
            </span>
          )}
          <Badge variant="outline" className="text-[10px] shrink-0">
            {log.entity}
          </Badge>
        </div>

        {/* Meta */}
        {log.meta && !compact && (
          <p className="text-xs text-muted-foreground font-mono">
            {Object.entries(log.meta)
              .filter(([, v]) => v !== null && v !== "")
              .map(([k, v]) => `${k}: ${v}`)
              .join("  ·  ")}
          </p>
        )}

        {/* User + time */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {log.user && (
            <div className="flex items-center gap-1">
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-[8px] bg-muted font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span>{log.user.name}</span>
              <span className="text-[10px] opacity-60 capitalize">
                ({log.user.role.toLowerCase()})
              </span>
            </div>
          )}
          <span>·</span>
          <span title={format(new Date(log.createdAt), "dd MMM yyyy HH:mm:ss")}>
            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
};
