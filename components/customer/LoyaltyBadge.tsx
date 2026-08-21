import { getCustomerTier, getNextTier } from "@/lib/loyalty";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

type Props = {
  points: number;
  showNext?: boolean;
  size?: "sm" | "md";
};

export const LoyaltyBadge = ({
  points,
  showNext = false,
  size = "md",
}: Props) => {
  const tier = getCustomerTier(points);
  const nextTier = getNextTier(points);
  const progress = nextTier
    ? ((points - tier.min) / (nextTier.min - tier.min)) * 100
    : 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Badge
          style={{ backgroundColor: tier.color, color: "#fff" }}
          className={cn(
            "gap-1 font-semibold",
            size === "sm" ? "text-[10px] px-1.5" : "text-xs",
          )}
        >
          <Trophy size={size === "sm" ? 9 : 11} />
          {tier.name}
        </Badge>
        <span
          className={cn("font-bold", size === "sm" ? "text-xs" : "text-sm")}
        >
          {points.toLocaleString()} pts
        </span>
      </div>

      {showNext && nextTier && (
        <div className="space-y-0.5">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden w-full">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: tier.color,
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {(nextTier.min - points).toLocaleString()} pts to {nextTier.name}
          </p>
        </div>
      )}
    </div>
  );
};
