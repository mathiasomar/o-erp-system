import { cookies, headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BRANCH_COOKIE } from "@/lib/branch-context";
import NavbarComponent from "./NavbarComponent";

const Navbar = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "ADMIN";

  // Only admins need the full branch list for switching
  const branches = isAdmin
    ? await prisma.branch.findMany({
        where: { isActive: true },
        orderBy: [{ isDefault: "desc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          code: true,
          isDefault: true,
          isActive: true,
        },
      })
    : [];

  // Resolve current branch — cookie for admin, DB record for everyone else
  const cookieStore = await cookies();
  const cookieBranchId = cookieStore.get(BRANCH_COOKIE)?.value;

  let currentBranchId = cookieBranchId ?? "";

  if (!isAdmin && session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { branchId: true },
    });
    currentBranchId = user?.branchId ?? "";
  }

  if (!currentBranchId && branches.length > 0) {
    currentBranchId = branches.find((b) => b.isDefault)?.id ?? branches[0].id;
  }

  // For non-admin, fetch their single branch (read-only display)
  let myBranch = null;
  if (!isAdmin && currentBranchId) {
    myBranch = await prisma.branch.findUnique({
      where: { id: currentBranchId },
      select: { id: true, name: true, code: true },
    });
  }

  return (
    <NavbarComponent
      branches={branches}
      currentBranchId={currentBranchId}
      myBranch={myBranch}
      isAdmin={isAdmin}
    />
  );
};

export default Navbar;
