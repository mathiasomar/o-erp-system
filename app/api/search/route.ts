import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (!q || q.length < 2) {
      return NextResponse.json({ products: [], orders: [], users: [] });
    }

    const [products, orders, users] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          category: { select: { name: true, color: true } },
        },
        take: 5,
      }),
      prisma.order.findMany({
        where: {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" } },
            {
              payment: {
                splitPayments: {
                  some: { mpesaRef: { contains: q, mode: "insensitive" } },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, email: true, role: true },
        take: 5,
      }),
    ]);

    return NextResponse.json({ products, orders, users });
  } catch {
    return NextResponse.json({ message: "Search failed" }, { status: 500 });
  }
};
