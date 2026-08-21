"use client";

import { useBranches, useBranchId } from "@/hooks/use-branches";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe } from "lucide-react";

// Shows which branch's data you're currently viewing
// Used on dashboard, reports, analytics, payments, activity pages

export const BranchLabel = () => {
  const { data: session } = authClient.useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "ADMIN";

  const { data: branchId = "" } = useBranchId();
  const { data: branches = [] } = useBranches();

  if (!isAdmin) return null; // non-admin always sees their branch — no label needed

  const current = branches.find((b) => b.id === branchId);

  return (
    <Badge variant="outline" className="gap-1.5 text-xs font-normal">
      {current ? (
        <>
          <Building2 size={11} /> {current.name} ({current.code})
        </>
      ) : (
        <>
          <Globe size={11} /> All branches
        </>
      )}
    </Badge>
  );
};
