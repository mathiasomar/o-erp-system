import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { subDays, startOfDay, format } from "date-fns";

export const maxDuration = 30;

export const POST = async (req: NextRequest) => {
  try {
    // Auth check — manager and admin only
    const session = await auth.api.getSession({ headers: await headers() });
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!role || role === "CASHIER") {
      return new Response("Forbidden", { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const branchId =
      typeof body.branchId === "string" ? body.branchId : undefined;
    const rawMessages: unknown[] = Array.isArray(body.messages)
      ? body.messages
      : [];

    const messages: UIMessage[] = rawMessages
      .filter(
        (message): message is Record<string, unknown> =>
          Boolean(message) && typeof message === "object",
      )
      .map((message) => {
        const role = typeof message.role === "string" ? message.role : "user";
        const content =
          typeof message.content === "string" ? message.content : "";
        const existingParts = Array.isArray(message.parts) ? message.parts : [];

        return {
          id: typeof message.id === "string" ? message.id : crypto.randomUUID(),
          role: role as UIMessage["role"],
          parts:
            existingParts.length > 0
              ? existingParts
              : [{ type: "text", text: content }],
        } as UIMessage;
      });

    const modelMessages = await convertToModelMessages(messages);

    // ── Build business context for the AI ────────────────────────────────────
    // Fetch real data so the AI can reason about it accurately

    const bw = branchId ? { branchId } : {};
    const now = new Date();
    const day30 = startOfDay(subDays(now, 29));
    const day7 = startOfDay(subDays(now, 6));
    const todayStart = startOfDay(now);

    const [
      // Revenue
      revenue30,
      revenue7,
      revenueToday,
      // Orders
      orderCount30,
      orderCount7,
      orderCountToday,
      pendingOrders,
      // Products
      topProducts30,
      lowStockItems,
      outOfStockItems,
      totalProducts,
      // Expenses
      expenses30,
      expensesToday,
      expenseByCategory,
      // Customers
      totalCustomers,
      newCustomers30,
      // Payments
      splitPayments30,
      // Layaways
      // activeLayaways,
    ] = await Promise.all([
      // Revenue
      prisma.order.aggregate({
        where: { ...bw, status: "COMPLETED", createdAt: { gte: day30 } },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.order.aggregate({
        where: { ...bw, status: "COMPLETED", createdAt: { gte: day7 } },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.order.aggregate({
        where: { ...bw, status: "COMPLETED", createdAt: { gte: todayStart } },
        _sum: { total: true },
        _count: { id: true },
      }),

      // Order counts
      prisma.order.count({
        where: { ...bw, status: "COMPLETED", createdAt: { gte: day30 } },
      }),
      prisma.order.count({
        where: { ...bw, status: "COMPLETED", createdAt: { gte: day7 } },
      }),
      prisma.order.count({
        where: { ...bw, status: "COMPLETED", createdAt: { gte: todayStart } },
      }),
      prisma.order.count({ where: { ...bw, status: "PENDING" } }),

      // Top products
      prisma.orderItem.groupBy({
        by: ["productId", "productName"],
        where: {
          order: { ...bw, status: "COMPLETED", createdAt: { gte: day30 } },
        },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: "desc" } },
        take: 10,
      }),

      // Stock
      prisma.stock
        .findMany({
          where: { ...bw, quantity: { gt: 0 } },
          include: { product: { select: { name: true } } },
          orderBy: { quantity: "asc" },
          take: 10,
        })
        .then((stocks) => stocks.filter((s) => s.quantity <= s.lowStockAt)),

      prisma.stock.count({ where: { ...bw, quantity: 0 } }),
      prisma.product.count({ where: { ...bw, isActive: true } }),

      // Expenses
      prisma.expense.aggregate({
        where: { ...bw, date: { gte: day30 } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { ...bw, date: { gte: todayStart } },
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ["categoryId"],
        where: { ...bw, date: { gte: day30 } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 5,
      }),

      // Customers
      prisma.customer.count({ where: { branchId: branchId ?? undefined } }),
      prisma.customer.count({
        where: {
          branchId: branchId ?? undefined,
          createdAt: { gte: day30 },
        },
      }),

      // Payment method split
      prisma.splitPayment.findMany({
        where: {
          payment: {
            order: { ...bw, status: "COMPLETED", createdAt: { gte: day30 } },
          },
        },
        select: { method: true, amount: true },
      }),

      // Layaways
      // prisma.layaway.count({ where: { ...bw, status: "ACTIVE" } }).catch(() => 0),
    ]);

    // Aggregate payment methods
    const paymentMix = splitPayments30.reduce<Record<string, number>>(
      (acc, sp) => {
        acc[sp.method] = (acc[sp.method] ?? 0) + sp.amount;
        return acc;
      },
      {},
    );

    const totalRev30 = revenue30._sum.total ?? 0;
    const totalExp30 = expenses30._sum.amount ?? 0;
    const netProfit30 = totalRev30 - totalExp30;

    // Build the system context string
    const businessContext = `
You are an AI business analyst assistant for a Kenyan retail POS system.
You have access to REAL-TIME business data. Be concise, specific, and actionable.
Always reference actual numbers from the data below. Format currency as KES.
Today is ${format(now, "EEEE, dd MMMM yyyy")}.

## Current Business Snapshot

### Revenue (Last 30 days)
- Total revenue: KES ${totalRev30.toLocaleString()}
- Last 7 days revenue: KES ${(revenue7._sum.total ?? 0).toLocaleString()}
- Total expenses: KES ${totalExp30.toLocaleString()}
- Today's expenses: KES ${(expensesToday._sum.amount ?? 0).toLocaleString()}
- Net profit: KES ${netProfit30.toLocaleString()}
- Profit margin: ${totalRev30 > 0 ? ((netProfit30 / totalRev30) * 100).toFixed(1) : 0}%

### Orders
- Last 30 days: ${orderCount30} orders
- Last 7 days: ${orderCount7} orders
- Today so far: ${orderCountToday} orders (KES ${(revenueToday._sum.total ?? 0).toLocaleString()})
- Pending: ${pendingOrders} orders awaiting completion
- Average order value (30d): KES ${orderCount30 > 0 ? (totalRev30 / orderCount30).toFixed(0) : 0}

### Top Products (Last 30 days)
${topProducts30
  .slice(0, 8)
  .map(
    (p, i) =>
      `${i + 1}. ${p.productName}: ${p._sum.quantity ?? 0} units, KES ${(p._sum.total ?? 0).toLocaleString()}`,
  )
  .join("\n")}

### Inventory
- Total active products: ${totalProducts}
- Low stock items: ${lowStockItems.length} products
${lowStockItems
  .slice(0, 5)
  .map(
    (s) =>
      `  - ${s.product.name}: ${s.quantity} units left (alert at ${s.lowStockAt})`,
  )
  .join("\n")}
- Out of stock: ${outOfStockItems} products

### Payment Methods (30 days)
${Object.entries(paymentMix)
  .sort(([, a], [, b]) => b - a)
  .map(([m, amt]) => `- ${m}: KES ${amt.toLocaleString()}`)
  .join("\n")}

### Customers
- Total customers: ${totalCustomers}
- New customers (30 days): ${newCustomers30}

### Expenses by category (Last 30 days)
${expenseByCategory
  .slice(0, 5)
  .map(
    (expense, i) =>
      `  ${i + 1}. ${expense.categoryId ?? "Unknown"}: KES ${(expense._sum.amount ?? 0).toLocaleString()}`,
  )
  .join("\n")}

## Your Role
Answer questions about this business. Provide:
- Sales trend analysis
- Inventory recommendations
- Profit optimisation tips
- Customer insights
- Expense analysis
- Pricing suggestions
- Operational improvements
Keep answers concise (2-4 paragraphs max unless asked for detail).
Use bullet points for lists. Be specific with numbers.
`.trim();

    const result = streamText({
      model: openai("gpt-4.1"),
      system: businessContext,
      messages: modelMessages,
      maxOutputTokens: 1024,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI route error:", error);

    const message = error instanceof Error ? error.message : "Unknown AI error";
    const friendlyMessage = /credit|quota|billing|insufficient/i.test(message)
      ? "AI service is unavailable because your OpenAI account does not have available credits."
      : "Unable to generate AI insights right now. Please try again in a moment.";

    return new Response(
      JSON.stringify({ error: friendlyMessage, details: message }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};
