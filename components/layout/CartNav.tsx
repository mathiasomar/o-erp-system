"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart";

export default function CartNav() {
  const { itemCount, total } = useCartStore();
  const count = itemCount();
  const totalAmount = total();

  return (
    <Link
      href="/dashboard/pos"
      className="hidden md:flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
    >
      <ShoppingCart size={16} />
      <span className="hidden lg:inline text-sm">Cart</span>
      {count > 0 && (
        <Badge variant="secondary" className="ml-1 text-xs">
          {count}
        </Badge>
      )}
      <span className="ml-2 hidden xl:inline text-xs text-muted-foreground">
        KES {totalAmount.toLocaleString()}
      </span>
    </Link>
  );
}
