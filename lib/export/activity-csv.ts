import * as XLSX from "xlsx";
import { ActivityLog } from "@/types";
import { format } from "date-fns";
import { ACTION_CONFIG } from "@/lib/activity-config";

export const exportActivityCSV = (
  logs: ActivityLog[],
  filename: string = "activity-log",
) => {
  const wb = XLSX.utils.book_new();

  const rows = [
    ["Date", "Action", "Entity", "Label", "User", "Role", "Details"],
    ...logs.map((log) => {
      const cfg = ACTION_CONFIG[log.action];
      const meta = log.meta
        ? Object.entries(log.meta)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")
        : "";
      return [
        format(new Date(log.createdAt), "dd MMM yyyy HH:mm:ss"),
        cfg?.label ?? log.action,
        log.entity,
        log.entityLabel ?? "—",
        log.user?.name ?? "Unknown",
        log.user?.role ?? "—",
        meta,
      ];
    }),
  ];

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(rows),
    "Activity Log",
  );

  XLSX.writeFile(wb, `${filename}-${format(new Date(), "yyyyMMdd")}.xlsx`);
};
