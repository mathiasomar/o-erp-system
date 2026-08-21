import { NextRequest, NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "./lib/prisma";
import { getPermissionsForRole } from "./lib/role";

const ROUTE_PERMISSIONS: { path: string; permission: string }[] = [
  { path: "/dashboard/users", permission: "users.view" },
  { path: "/dashboard/expenses", permission: "expenses.view" },
  { path: "/dashboard/inventory", permission: "inventory.view" },
  { path: "/dashboard/payments", permission: "payments.view" },
  { path: "/dashboard/reports", permission: "reports.view" },
  { path: "/dashboard/categories", permission: "categories.view" },
  { path: "/dashboard/products", permission: "products.view" },
  { path: "/dashboard/orders", permission: "orders.view" },
  { path: "/dashboard/settings", permission: "settings.view" },
  { path: "/dashboard/branches", permission: "users.view" },
  { path: "/dashboard/logs", permission: "users.view" },
  { path: "/dashboard/activity", permission: "reports.view" },
  { path: "/dashboard/analytics", permission: "reports.view" },
  { path: "/dashboard/customers", permission: "customers.view" },
  { path: "/dashboard/branches", permission: "branches.view" },
  { path: "/dashboard/purchases", permission: "inventory.view" },
  { path: "/dashboard/suppliers", permission: "inventory.view" },
];

const getHomePage = (role: string) =>
  role === "CASHIER" ? "/dashboard/pos" : "/dashboard";

export const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  const session = await auth.api.getSession({ headers: await nextHeaders() });
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const role =
    (session.user as { role?: string }).role?.toUpperCase() ?? "CASHIER";
  const isAdmin = role === "ADMIN";
  const homePage = getHomePage(role);

  // Check account active
  if ("isActive" in session.user && !(session.user.isActive as boolean)) {
    const url = new URL("/", request.url);
    url.searchParams.set("error", "account_disabled");
    return NextResponse.redirect(url);
  }

  // Non-admin without a branch → redirect to login
  if (!isAdmin) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { branchId: true },
    });
    if (!user?.branchId) {
      const url = new URL("/", request.url);
      url.searchParams.set("error", "no_branch_assigned");
      return NextResponse.redirect(url);
    }
  }

  // Cashier → POS only
  if (role === "CASHIER" && pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/dashboard/pos", request.url));
  }

  // Permission check
  const perms = await getPermissionsForRole(role);
  const matchedRoute = ROUTE_PERMISSIONS.find((r) =>
    pathname.startsWith(r.path),
  );
  if (matchedRoute && !perms.has(matchedRoute.permission)) {
    const url = new URL(homePage, request.url);
    url.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/dashboard/:path*"],
};
