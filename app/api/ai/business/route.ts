import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { subDays, startOfDay, format } from "date-fns";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // ---------------------------------------------------------
    // AUTHENTICATION
    // ---------------------------------------------------------

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const role = (session?.user as { role?: string } | undefined)?.role;

    // Only ADMIN and MANAGER can use the business analyst
    if (!session || !role || role === "CASHIER") {
      return new Response("Forbidden", {
        status: 403,
      });
    }

    // ---------------------------------------------------------
    // REQUEST
    // ---------------------------------------------------------

    const {
      messages,
      branchId,
    }: {
      messages: UIMessage[];
      branchId?: string;
    } = await req.json();

    // ---------------------------------------------------------
    // DATE RANGES
    // ---------------------------------------------------------

    const now = new Date();

    const day30 = startOfDay(subDays(now, 29));
    const day7 = startOfDay(subDays(now, 6));
    const todayStart = startOfDay(now);

    // ---------------------------------------------------------
    // BRANCH FILTER
    // ---------------------------------------------------------

    const branchFilter = branchId
      ? {
          branchId,
        }
      : {};

    // ---------------------------------------------------------
    // FETCH BUSINESS DATA
    // ---------------------------------------------------------

    const [
      revenue30,
      revenue7,
      revenueToday,

      orderCount30,
      orderCount7,
      orderCountToday,
      pendingOrders,

      topProducts30,

      lowStockItems,
      outOfStockItems,
      totalProducts,

      expenses30,
      expensesToday,
      expenseByCategory,

      totalCustomers,
      newCustomers30,

      splitPayments30,

      activeLayaways,
    ] = await Promise.all([
      // -------------------------------------------------------
      // REVENUE
      // -------------------------------------------------------

      prisma.order.aggregate({
        where: {
          ...branchFilter,
          status: "COMPLETED",
          createdAt: {
            gte: day30,
          },
        },
        _sum: {
          total: true,
        },
        _count: {
          id: true,
        },
      }),

      prisma.order.aggregate({
        where: {
          ...branchFilter,
          status: "COMPLETED",
          createdAt: {
            gte: day7,
          },
        },
        _sum: {
          total: true,
        },
        _count: {
          id: true,
        },
      }),

      prisma.order.aggregate({
        where: {
          ...branchFilter,
          status: "COMPLETED",
          createdAt: {
            gte: todayStart,
          },
        },
        _sum: {
          total: true,
        },
        _count: {
          id: true,
        },
      }),

      // -------------------------------------------------------
      // ORDERS
      // -------------------------------------------------------

      prisma.order.count({
        where: {
          ...branchFilter,
          status: "COMPLETED",
          createdAt: {
            gte: day30,
          },
        },
      }),

      prisma.order.count({
        where: {
          ...branchFilter,
          status: "COMPLETED",
          createdAt: {
            gte: day7,
          },
        },
      }),

      prisma.order.count({
        where: {
          ...branchFilter,
          status: "COMPLETED",
          createdAt: {
            gte: todayStart,
          },
        },
      }),

      prisma.order.count({
        where: {
          ...branchFilter,
          status: "PENDING",
        },
      }),

      // -------------------------------------------------------
      // TOP PRODUCTS
      // -------------------------------------------------------

      prisma.orderItem.groupBy({
        by: ["productId", "productName"],
        where: {
          order: {
            ...branchFilter,
            status: "COMPLETED",
            createdAt: {
              gte: day30,
            },
          },
        },
        _sum: {
          quantity: true,
          total: true,
        },
        orderBy: {
          _sum: {
            total: "desc",
          },
        },
        take: 10,
      }),

      // -------------------------------------------------------
      // INVENTORY
      // -------------------------------------------------------

      prisma.stock
        .findMany({
          where: {
            ...branchFilter,
            quantity: {
              gt: 0,
            },
          },
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            quantity: "asc",
          },
          take: 20,
        })
        .then((stocks) =>
          stocks.filter((stock) => stock.quantity <= stock.lowStockAt),
        ),

      prisma.stock.count({
        where: {
          ...branchFilter,
          quantity: 0,
        },
      }),

      prisma.product.count({
        where: {
          ...branchFilter,
          isActive: true,
        },
      }),

      // -------------------------------------------------------
      // EXPENSES
      // -------------------------------------------------------

      prisma.expense.aggregate({
        where: {
          ...branchFilter,
          date: {
            gte: day30,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.expense.aggregate({
        where: {
          ...branchFilter,
          date: {
            gte: todayStart,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.expense.groupBy({
        by: ["categoryId"],
        where: {
          ...branchFilter,
          date: {
            gte: day30,
          },
        },
        _sum: {
          amount: true,
        },
        orderBy: {
          _sum: {
            amount: "desc",
          },
        },
        take: 5,
      }),

      // -------------------------------------------------------
      // CUSTOMERS
      // -------------------------------------------------------

      prisma.customer.count({
        where: {
          branchId: branchId ?? undefined,
        },
      }),

      prisma.customer.count({
        where: {
          branchId: branchId ?? undefined,
          createdAt: {
            gte: day30,
          },
        },
      }),

      // -------------------------------------------------------
      // PAYMENTS
      // -------------------------------------------------------

      prisma.splitPayment.findMany({
        where: {
          payment: {
            order: {
              ...branchFilter,
              status: "COMPLETED",
              createdAt: {
                gte: day30,
              },
            },
          },
        },
        select: {
          method: true,
          amount: true,
        },
      }),

      // -------------------------------------------------------
      // LAYAWAYS
      // -------------------------------------------------------

      prisma.layaway
        .count({
          where: {
            ...branchFilter,
            status: "ACTIVE",
          },
        })
        .catch(() => 0),
    ]);

    // ---------------------------------------------------------
    // CALCULATIONS
    // ---------------------------------------------------------

    const paymentMix = splitPayments30.reduce<Record<string, number>>(
      (acc, payment) => {
        acc[payment.method] =
          (acc[payment.method] ?? 0) + Number(payment.amount);

        return acc;
      },
      {},
    );

    const totalRev30 = Number(revenue30._sum.total ?? 0);

    const totalRev7 = Number(revenue7._sum.total ?? 0);

    const totalRevToday = Number(revenueToday._sum.total ?? 0);

    const totalExp30 = Number(expenses30._sum.amount ?? 0);

    const totalExpToday = Number(expensesToday._sum.amount ?? 0);

    const netProfit30 = totalRev30 - totalExp30;

    const profitMargin = totalRev30 > 0 ? (netProfit30 / totalRev30) * 100 : 0;

    const averageOrderValue = orderCount30 > 0 ? totalRev30 / orderCount30 : 0;

    // ---------------------------------------------------------
    // BUSINESS CONTEXT
    // ---------------------------------------------------------

    const businessContext = `
You are an AI business analyst assistant for a Kenyan retail POS system.

You have access to REAL-TIME business data from the POS database.

Your job is to help managers and administrators understand the business
and make better operational decisions.

IMPORTANT RULES:

1. Use the actual business numbers provided below.
2. Never invent sales, expenses, products, customers or other business data.
3. Currency is Kenyan Shillings (KES).
4. Be concise and practical.
5. When making recommendations, explain the reason.
6. If the available data is insufficient to answer something, say so.
7. Do not expose database implementation details.
8. Do not claim to have access to information that is not provided below.
9. When comparing periods, clearly identify the periods.
10. Focus on actionable business recommendations.

Today is ${format(now, "EEEE, dd MMMM yyyy")}.

==================================================
BUSINESS SNAPSHOT
==================================================

Revenue - Last 30 Days
----------------------

Total revenue:
KES ${totalRev30.toLocaleString()}

Total expenses:
KES ${totalExp30.toLocaleString()}

Net profit:
KES ${netProfit30.toLocaleString()}

Profit margin:
${profitMargin.toFixed(1)}%

Revenue - Last 7 Days
---------------------

KES ${totalRev7.toLocaleString()}

Revenue - Today
---------------

KES ${totalRevToday.toLocaleString()}

Expenses - Today
----------------

KES ${totalExpToday.toLocaleString()}

==================================================
ORDERS
==================================================

Completed orders - Last 30 days:
${orderCount30}

Completed orders - Last 7 days:
${orderCount7}

Completed orders - Today:
${orderCountToday}

Pending orders:
${pendingOrders}

Average order value:
KES ${averageOrderValue.toFixed(0)}

==================================================
TOP PRODUCTS - LAST 30 DAYS
==================================================

${
  topProducts30.length > 0
    ? topProducts30
        .slice(0, 8)
        .map(
          (product, index) =>
            `${index + 1}. ${product.productName}: ${
              product._sum.quantity ?? 0
            } units sold, KES ${Number(
              product._sum.total ?? 0,
            ).toLocaleString()}`,
        )
        .join("\n")
    : "No product sales data available."
}

==================================================
INVENTORY
==================================================

Total active products:
${totalProducts}

Low-stock products:
${lowStockItems.length}

${
  lowStockItems.length > 0
    ? lowStockItems
        .slice(0, 10)
        .map(
          (stock) =>
            `- ${stock.product.name}: ${stock.quantity} units remaining; low-stock threshold: ${stock.lowStockAt}`,
        )
        .join("\n")
    : "No low-stock products."
}

Out-of-stock products:
${outOfStockItems}

==================================================
PAYMENT METHODS - LAST 30 DAYS
==================================================

${
  Object.keys(paymentMix).length > 0
    ? Object.entries(paymentMix)
        .sort(([, a], [, b]) => b - a)
        .map(
          ([method, amount]) => `- ${method}: KES ${amount.toLocaleString()}`,
        )
        .join("\n")
    : "No payment data available."
}

==================================================
CUSTOMERS
==================================================

Total customers:
${totalCustomers}

New customers - Last 30 days:
${newCustomers30}

==================================================
EXPENSES
==================================================

Top expense categories are available in the database.

==================================================
LAYAWAYS
==================================================

Active layaway agreements:
${activeLayaways}

==================================================
YOUR RESPONSIBILITIES
==================================================

You can help with:

- Sales trend analysis
- Revenue analysis
- Profit analysis
- Inventory recommendations
- Low-stock recommendations
- Product performance
- Customer insights
- Expense analysis
- Pricing suggestions
- Payment method analysis
- Operational improvements
- Management decisions

Keep normal answers to approximately 2-4 paragraphs.

Use bullet points when appropriate.

Always include specific numbers when answering questions
about the business.
`.trim();

    // ---------------------------------------------------------
    // CONVERT UI MESSAGES TO MODEL MESSAGES
    // ---------------------------------------------------------

    const modelMessages = await convertToModelMessages(messages);

    // ---------------------------------------------------------
    // STREAM RESPONSE
    // ---------------------------------------------------------

    const result = streamText({
      model: anthropic("claude-sonnet-4-6"),

      system: businessContext,

      messages: modelMessages,

      maxOutputTokens: 1024,
    });

    // ---------------------------------------------------------
    // AI SDK UI STREAM RESPONSE
    // ---------------------------------------------------------

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Business AI error:", error);

    return new Response(
      JSON.stringify({
        error: "Unable to process your business analysis request.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
