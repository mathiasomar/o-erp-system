import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { resolveBranchContext } from "@/lib/branch-context";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveBranchContext();
    if (!ctx) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const method = searchParams.get("method") ?? undefined;
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    const payments = await prisma.payment.findMany({
      where: {
        // ── Branch scope ──────────────────────────────────────────────────────
        order: {
          branchId: ctx.branchId,
          ...(from || to
            ? {
                createdAt: {
                  ...(from && { gte: new Date(from) }),
                  ...(to && { lte: new Date(to) }),
                },
              }
            : {}),
        },

        // ── Method filter → now on splitPayments, not Payment ─────────────────
        ...(method &&
          method !== "ALL" && {
            splitPayments: {
              some: {
                method: method as "CASH" | "MPESA" | "CARD",
              },
            },
          }),

        // ── Search → mpesaRef and mpesaPhone now on splitPayments ─────────────
        ...(search && {
          OR: [
            {
              splitPayments: {
                some: {
                  mpesaRef: { contains: search, mode: "insensitive" },
                },
              },
            },
            {
              splitPayments: {
                some: {
                  mpesaPhone: { contains: search, mode: "insensitive" },
                },
              },
            },
            {
              order: {
                orderNumber: { contains: search, mode: "insensitive" },
              },
            },
          ],
        }),
      },

      include: {
        // ── Must include splitPayments — method/ref/phone all live here now ───
        splitPayments: {
          orderBy: { amount: "desc" },
        },
        order: {
          select: {
            orderNumber: true,
            status: true,
            total: true,
            items: { select: { quantity: true } },
            user: { select: { name: true, role: true } },
            customer: { select: { name: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Summary stats ─────────────────────────────────────────────────────────

    const activePayments = payments.filter(
      (p) => p.order.status !== "CANCELLED",
    );

    const totalRevenue = activePayments.reduce((sum, p) => sum + p.amount, 0);

    // byMethod: sum split lines per method across all active payments
    const byMethod: Record<string, number> = {
      CASH: 0,
      MPESA: 0,
      CARD: 0,
    };

    activePayments.forEach((p) => {
      p.splitPayments.forEach((sp) => {
        byMethod[sp.method] = (byMethod[sp.method] ?? 0) + sp.amount;
      });
    });

    return NextResponse.json({ payments, totalRevenue, byMethod });
  } catch (e) {
    console.error("[payments route]", e);
    return NextResponse.json(
      { message: "Failed to fetch payments" },
      { status: 500 },
    );
  }
}
