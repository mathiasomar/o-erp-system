"use client";

import { useState } from "react";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";
import { NOTIFICATION_CONFIG } from "@/lib/notification-config";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  // const router = useRouter();

  const { data } = useNotifications();
  const { mutate: markOne } = useMarkNotificationRead();
  const { mutate: markAll, isPending: markingAll } =
    useMarkAllNotificationsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleClick = (notif: (typeof notifications)[number]) => {
    if (!notif.read) markOne(notif.id);
    if (notif.link) {
      setOpen(false);
      // router.push(notif.link);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell size={16} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1
                             rounded-full bg-destructive text-[10px]
                             text-white flex items-center justify-center
                             font-medium"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2"
              disabled={markingAll}
              onClick={() => markAll()}
            >
              <CheckCheck size={12} className="mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <Separator />

        {/* List */}
        {notifications.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center
                          py-10 gap-2 text-muted-foreground"
          >
            <Inbox size={24} className="opacity-30" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            {notifications.map((n) => {
              const cfg =
                NOTIFICATION_CONFIG[n.type] ?? NOTIFICATION_CONFIG.SYSTEM;
              const Icon = cfg.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-2.5 text-left",
                    "border-b last:border-0 hover:bg-muted/50 transition-colors",
                    !n.read && "bg-muted/30",
                  )}
                >
                  <div
                    className={cn("p-1.5 rounded-lg shrink-0 mt-0.5", cfg.bg)}
                  >
                    <Icon size={13} className={cfg.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </button>
              );
            })}
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};
