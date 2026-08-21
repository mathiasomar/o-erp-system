import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveBranchContext } from "@/lib/branch-context";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    // ────────────────────────────────────────────────────────────────────────
    // Authentication / branch context
    // ────────────────────────────────────────────────────────────────────────

    const ctx = await resolveBranchContext();

    if (!ctx) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ────────────────────────────────────────────────────────────────────────
    // Query parameters
    // ────────────────────────────────────────────────────────────────────────

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || undefined;
    const status = searchParams.get("status") || undefined;
    const type = searchParams.get("type") || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    // ────────────────────────────────────────────────────────────────────────
    // Date filters
    // Kenya timezone: UTC+03:00
    // ────────────────────────────────────────────────────────────────────────

    const fromDate = from ? new Date(`${from}T00:00:00+03:00`) : undefined;

    const toDate = to ? new Date(`${to}T23:59:59.999+03:00`) : undefined;

    // Validate dates
    if (fromDate && Number.isNaN(fromDate.getTime())) {
      return NextResponse.json(
        { message: "Invalid 'from' date" },
        { status: 400 },
      );
    }

    if (toDate && Number.isNaN(toDate.getTime())) {
      return NextResponse.json(
        { message: "Invalid 'to' date" },
        { status: 400 },
      );
    }

    // ────────────────────────────────────────────────────────────────────────
    // Verify Receipt model exists on Prisma client
    // ────────────────────────────────────────────────────────────────────────

    if (!prisma.receipt) {
      console.error(
        "Prisma Receipt model is not available.",
        Object.keys(prisma).filter((key) =>
          key.toLowerCase().includes("receipt"),
        ),
      );

      return NextResponse.json(
        {
          message:
            "Receipt model is not available in the generated Prisma Client. Run `pnpm prisma generate` and verify your Prisma Client import.",
        },
        { status: 500 },
      );
    }

    // ────────────────────────────────────────────────────────────────────────
    // Build where condition
    // ────────────────────────────────────────────────────────────────────────

    const where = {
      branchId: ctx.branchId,

      ...(status && status !== "ALL"
        ? {
            status: status as never,
          }
        : {}),

      ...(type && type !== "ALL"
        ? {
            type: type as never,
          }
        : {}),

      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                receiptNumber: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },

              {
                user: {
                  name: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },

              {
                customer: {
                  name: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },

              {
                order: {
                  orderNumber: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },

              {
                order: {
                  payment: {
                    splitPayments: {
                      some: {
                        mpesaRef: {
                          contains: search,
                          mode: "insensitive" as const,
                        },
                      },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    // ────────────────────────────────────────────────────────────────────────
    // Fetch receipts
    // ────────────────────────────────────────────────────────────────────────

    const receipts = await prisma.receipt.findMany({
      where,

      include: {
        // Receipt items
        items: true,

        // User who created the receipt
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },

        // Customer
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },

        // User who voided the receipt
        voidedBy: {
          select: {
            id: true,
            name: true,
          },
        },

        // Related order
        order: {
          include: {
            payment: {
              include: {
                splitPayments: {
                  orderBy: {
                    amount: "desc",
                  },
                },
              },
            },
          },
        },

        // Child receipts
        childReceipts: {
          select: {
            id: true,
            receiptNumber: true,
            total: true,
            status: true,
          },
        },

        // Parent receipt
        parentReceipt: {
          select: {
            id: true,
            receiptNumber: true,
          },
        },

        // Original receipt
        originalReceipt: {
          select: {
            id: true,
            receiptNumber: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    // ────────────────────────────────────────────────────────────────────────
    // Response
    // ────────────────────────────────────────────────────────────────────────

    return NextResponse.json(receipts);
  } catch (error) {
    console.error("GET /api/receipts error:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch receipts",
      },
      { status: 500 },
    );
  }
};
