import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const BRANCH_COOKIE = "x-branch-id";

export type BranchContext = {
  branchId: string;
  isAdmin: boolean;
  userId: string;
  role: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Core resolver — call at the top of every API route and server action
// ─────────────────────────────────────────────────────────────────────────────

export const resolveBranchContext = async (): Promise<BranchContext | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const role = (session.user as { role?: string }).role ?? "CASHIER";
  const isAdmin = role === "ADMIN";

  if (isAdmin) {
    // Admin: read selected branch from cookie
    const cookieStore = await cookies();
    const cookieBranch = cookieStore.get(BRANCH_COOKIE)?.value;

    if (cookieBranch) {
      return { branchId: cookieBranch, isAdmin: true, userId, role };
    }

    // No cookie yet — fall back to default branch
    const def = await prisma.branch.findFirst({
      where: { isDefault: true },
    });
    if (!def) return null;
    return { branchId: def.id, isAdmin: true, userId, role };
  }

  // Non-admin: always their assigned branch from DB
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { branchId: true },
  });

  if (!user?.branchId) {
    // Fallback to default branch if not assigned
    const def = await prisma.branch.findFirst({
      where: { isDefault: true },
    });
    if (!def) return null;
    return { branchId: def.id, isAdmin: false, userId, role };
  }

  return { branchId: user.branchId, isAdmin: false, userId, role };
};

// Throws if no context — use in mutations
export const requireBranchContext = async (): Promise<BranchContext> => {
  const ctx = await resolveBranchContext();
  if (!ctx) throw new Error("Not authenticated");
  return ctx;
};
