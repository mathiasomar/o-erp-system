import { requireBranchContext } from "@/lib/branch-context";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async () => {
  const ctx = await requireBranchContext();

  const branchId = ctx.branchId;
  return NextResponse.json({ branchId });
};
