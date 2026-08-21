import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      include: {
        category: true,
        stock: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(products);
  } catch {
    return NextResponse.json(
      { message: "Failed to export products" },
      { status: 500 },
    );
  }
};
