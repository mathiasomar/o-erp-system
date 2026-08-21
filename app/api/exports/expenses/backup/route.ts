import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const role = (session?.user as { role?: string } | undefined)?.role;

    // Backup is ADMIN only
    if (!session?.user || role !== "ADMIN") {
      return NextResponse.json({ message: "Admin only" }, { status: 403 });
    }

    const [
      orders,
      products,
      expenses,
      categories,
      users,
      activityLogs,
      stockLogs,
      settings,
    ] = await Promise.all([
      prisma.order.findMany({
        include: { items: true, payment: true },
      }),
      prisma.product.findMany({
        include: { category: true, stock: true },
      }),
      prisma.expense.findMany({
        include: { category: true },
      }),
      prisma.category.findMany(),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10000, // cap for performance
      }),
      prisma.stockLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 5000,
      }),
      prisma.systemSetting.findMany({
        where: { isSecret: false }, // never export secrets
      }),
    ]);

    const backup = {
      meta: {
        exportedAt: new Date().toISOString(),
        exportedBy: session.user.name ?? session.user.email,
        version: "1.0",
        counts: {
          orders: orders.length,
          products: products.length,
          expenses: expenses.length,
          categories: categories.length,
          users: users.length,
          activityLogs: activityLogs.length,
          stockLogs: stockLogs.length,
        },
      },
      orders,
      products,
      expenses,
      categories,
      users,
      activityLogs,
      stockLogs,
      settings,
    };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="backup-${Date.now()}.json"`,
      },
    });
  } catch {
    return NextResponse.json({ message: "Backup failed" }, { status: 500 });
  }
};
