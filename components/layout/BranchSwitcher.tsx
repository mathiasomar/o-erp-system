"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { switchBranch } from "@/actions/branch.action";
import { useQueryClient } from "@tanstack/react-query";

type BranchSummary = {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
  isActive: boolean;
};

type Props = {
  branches: BranchSummary[];
  currentBranchId: string;
  myBranch: { id: string; name: string; code: string } | null;
  isAdmin: boolean;
};

export const BranchSwitcher = ({
  branches,
  currentBranchId,
  myBranch,
  isAdmin,
}: Props) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const qc = useQueryClient();

  // ── Non-admin: read-only badge showing assigned branch ────────────────────
  if (!isAdmin) {
    return (
      <Badge variant="outline" className="gap-1.5 font-normal hidden sm:flex">
        <Building2 size={11} />
        {myBranch?.name ?? "No branch"}
      </Badge>
    );
  }

  // ── Admin: interactive switcher ────────────────────────────────────────────
  const handleSwitch = (branchId: string) => {
    startTransition(async () => {
      const result = await switchBranch(branchId);
      if (result.success) {
        await qc.invalidateQueries();
        await qc.refetchQueries();
        router.refresh();

        toast.success(`Switched to ${result.branch?.name}`);
      } else {
        toast.error(result.error ?? "Failed to switch branch");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {isPending && (
        <Loader2 size={13} className="animate-spin text-muted-foreground" />
      )}
      <Select
        value={currentBranchId}
        onValueChange={handleSwitch}
        disabled={isPending}
      >
        <SelectTrigger className="h-8 w-44 text-xs gap-1.5 flex">
          <Building2 size={12} className="text-muted-foreground shrink-0" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {branches.map((b) => (
            <SelectItem
              key={b.id}
              value={b.id}
              disabled={!b.isActive}
              className="text-xs"
            >
              <div className="flex items-center gap-2">
                <span>{b.name}</span>
                <span className="text-muted-foreground font-mono text-[10px]">
                  ({b.code})
                </span>
                {b.isDefault && (
                  <Badge variant="secondary" className="text-[9px] px-1">
                    Main
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
