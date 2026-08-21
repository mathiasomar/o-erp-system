"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type TimeDisplayProps = {
  className?: string;
};

const TimeDisplay = ({ className }: TimeDisplayProps) => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedDateTime = currentTime
    ? currentTime.toLocaleString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--";

  return (
    <div className={cn("text-sm text-muted-foreground", className)}>
      {formattedDateTime}
    </div>
  );
};

export default TimeDisplay;
