import { Package, ShoppingCart, Tag } from "lucide-react";
import { Card } from "./ui/card";
import { useCartStore } from "@/store/cart";
import { Product } from "@/types";
import { Badge } from "./ui/badge";
import Image from "next/image";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const stockQty = product.stock?.quantity ?? 0;
  const outOfStock = stockQty === 0;
  const hasLastPrice =
    product.lastPrice > 0 && product.lastPrice < product.price;

  return (
    <Card
      onClick={() => !outOfStock && addItem(product)}
      className={`relative p-4 select-none rounded-lg cursor-pointer
                  transition-all hover:shadow-md hover:border-primary/40
                border bg-card
        ${outOfStock ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {/* Product category */}
      {product.category && (
        <Badge
          style={{ backgroundColor: product.category.color ?? "#6b7280" }}
          className="text-white text-xs shrink-0 absolute top-2 right-2"
        >
          {product.category.name}
        </Badge>
      )}
      {/* Product image or icon */}
      {product.imageUrl ? (
        <Image
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-20 object-cover rounded-lg mb-2"
        />
      ) : (
        <div
          className="w-full h-20 bg-muted rounded-lg mb-2
                        flex items-center justify-center"
        >
          <Tag size={24} className="text-muted-foreground/40" />
        </div>
      )}
      <div className="flex justify-between items-start mb-2">
        <span className="flex gap-2">
          <Package size={15} className="text-primary" />
          <span className="flex flex-col gap-1">
            <span className="text-sm font-medium leading-tight">
              {product.name}
            </span>
            <span className="text-xs text-muted-foreground">{product.sku}</span>
          </span>
        </span>
      </div>
      <div className="flex justify-between items-center mt-2">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-primary">
            KES {product.price.toLocaleString()}
          </span>
          {hasLastPrice && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span>Min:</span>
              <span className="font-medium text-orange-600">
                KES {product.lastPrice.toLocaleString()}
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ShoppingCart size={12} />
          <span>{stockQty} left</span>
        </div>
      </div>
      {outOfStock && (
        <p className="text-xs text-destructive mt-1 font-medium">
          Out of stock
        </p>
      )}
    </Card>
  );
}
