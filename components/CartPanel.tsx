"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { useCartStore } from "@/store/cart";
import { ScrollArea } from "./ui/scroll-area";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type Props = { onCheckout: () => void };

export function CartPanel({ onCheckout }: Props) {
  const {
    items,
    removeItem,
    updateQuantity,
    total,
    clearCart,
    itemCount,
    updatePrice,
  } = useCartStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");

  const count = itemCount();

  // Check if any item has an invalid custom price
  const hasInvalidPrices = useMemo(() => {
    return items.some((item) => {
      // If there's no custom price, it's valid
      if (item.customPrice === null || item.customPrice === undefined)
        return false;

      const min =
        item.product.lastPrice > 0
          ? item.product.lastPrice
          : item.product.price;
      const max = item.product.price;

      // Check if custom price is outside the allowed range
      return item.customPrice < min || item.customPrice > max;
    });
  }, [items]);

  // Also check if currently editing an invalid price
  const isEditingInvalidPrice = useMemo(() => {
    if (!editingId) return false;
    const item = items.find((i) => i.product.id === editingId);
    if (!item) return false;

    const val = parseFloat(priceInput);
    const min =
      item.product.lastPrice > 0 ? item.product.lastPrice : item.product.price;
    const max = item.product.price;

    return isNaN(val) || val < min || val > max;
  }, [editingId, priceInput, items]);

  // Combine both checks - checkout should be disabled if ANY invalid prices exist OR currently editing an invalid price
  const shouldDisableCheckout =
    items.length === 0 || hasInvalidPrices || isEditingInvalidPrice;

  const startEdit = (item: (typeof items)[0]) => {
    const currentPrice = item.customPrice ?? item.product.price;
    setEditingId(item.product.id);
    setPriceInput(String(currentPrice));
  };

  const confirmEdit = (item: (typeof items)[0]) => {
    const val = parseFloat(priceInput);
    const min =
      item.product.lastPrice > 0 ? item.product.lastPrice : item.product.price;
    const max = item.product.price;

    if (isNaN(val) || val < min || val > max) {
      setPriceInput(String(item.customPrice ?? item.product.price));
      setEditingId(null);
      return;
    }

    updatePrice(item.product.id, val);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setPriceInput("");
  };

  // Check if a specific item's price input is invalid during editing
  const isPriceInvalid = (item: (typeof items)[0]) => {
    if (editingId !== item.product.id) return false;
    const val = parseFloat(priceInput);
    const min =
      item.product.lastPrice > 0 ? item.product.lastPrice : item.product.price;
    const max = item.product.price;
    return isNaN(val) || val < min || val > max;
  };

  return (
    <div className="flex flex-col h-[75vh] overflow-hidden">
      {/* ── Header — never scrolls ─────────────────────────────────────── */}
      <div className="flex items-center justify-between py-3 shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} className="text-muted-foreground" />
          <h2 className="font-semibold text-base">Cart</h2>
          {count > 0 && (
            <Badge variant="secondary" className="text-xs">
              {count} item{count !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="text-xs text-muted-foreground h-7"
          >
            Clear all
          </Button>
        )}
      </div>

      <Separator className="shrink-0" />

      {/* ── Items — ScrollArea grows to fill remaining space ───────────── */}
      <ScrollArea className="flex-1 min-h-0 py-2">
        {items.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center
                          h-full gap-3 text-center px-4 pt-16"
          >
            <div className="p-4 rounded-full bg-muted">
              <ShoppingCart size={24} className="text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Cart is empty</p>
              <p className="text-xs text-muted-foreground">
                Tap a product to add it
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 pr-3">
            {items.map((item) => {
              const stockQty = item.product.stock?.quantity ?? 0;
              const atMax = item.quantity >= stockQty;
              const unitPrice = item.customPrice ?? item.product.price;
              const isEditing = editingId === item.product.id;
              const hasLastPrice =
                item.product.lastPrice > 0 &&
                item.product.lastPrice < item.product.price;
              const isCustom =
                item.customPrice !== null &&
                item.customPrice !== item.product.price;
              const minPrice =
                item.product.lastPrice > 0
                  ? item.product.lastPrice
                  : item.product.price;

              // Check if this item has an invalid price (not during editing)
              const hasInvalidPrice =
                item.customPrice !== null &&
                item.customPrice !== undefined &&
                (item.customPrice < minPrice ||
                  item.customPrice > item.product.price);

              const isInvalid = isEditing ? isPriceInvalid(item) : false;

              return (
                <div
                  key={item.product.id}
                  className={cn(
                    "rounded-lg border p-2.5 space-y-2 hover:bg-muted/30 transition-colors",
                    hasInvalidPrice && "border-destructive/50 bg-destructive/5",
                  )}
                >
                  {/* Product name + remove */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight flex-1">
                      {item.product.name}
                    </p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground
                                 hover:text-destructive shrink-0"
                      onClick={() => removeItem(item.product.id)}
                    >
                      <Trash2 size={11} />
                    </Button>
                  </div>

                  {/* Price + Quantity controls */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Price section */}
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <div className="relative">
                            <span
                              className="absolute left-2 top-1/2 -translate-y-1/2
                                           text-xs text-muted-foreground"
                            >
                              KES
                            </span>
                            <Input
                              type="number"
                              value={priceInput}
                              min={minPrice}
                              max={item.product.price}
                              step="0.01"
                              onChange={(e) => setPriceInput(e.target.value)}
                              className={cn(
                                "h-7 w-28 pl-9 text-xs",
                                isInvalid && "border-destructive",
                              )}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") confirmEdit(item);
                                if (e.key === "Escape") cancelEdit();
                              }}
                            />
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-green-600 hover:text-green-700"
                            onClick={() => confirmEdit(item)}
                            disabled={isInvalid}
                          >
                            <Check size={12} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={cancelEdit}
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "text-sm font-bold",
                              isCustom && !hasInvalidPrice && "text-orange-600",
                              hasInvalidPrice && "text-destructive",
                            )}
                          >
                            KES {unitPrice.toLocaleString()}
                          </span>
                          {hasLastPrice && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-primary"
                              onClick={() => startEdit(item)}
                              title={`Edit price (min KES ${item.product.lastPrice.toLocaleString()})`}
                            >
                              <Pencil size={11} />
                            </Button>
                          )}
                          {isCustom && !hasInvalidPrice && (
                            <span className="text-[10px] text-orange-500 font-medium">
                              negotiated
                            </span>
                          )}
                          {hasInvalidPrice && (
                            <span className="text-[10px] text-destructive font-medium">
                              invalid price
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6"
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                      >
                        <Minus size={10} />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className={`h-6 w-6 ${atMax ? "opacity-40 cursor-not-allowed" : ""}`}
                        onClick={() =>
                          !atMax &&
                          updateQuantity(item.product.id, item.quantity + 1)
                        }
                        disabled={atMax}
                      >
                        <Plus size={10} />
                      </Button>
                    </div>
                  </div>

                  {/* Price range hint when editing */}
                  {isEditing && hasLastPrice && (
                    <p
                      className={cn(
                        "text-[10px]",
                        isInvalid
                          ? "text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      Range: KES {item.product.lastPrice.toLocaleString()}
                      {" – "}
                      KES {item.product.price.toLocaleString()}
                      {isInvalid && " · Price out of allowed range"}
                    </p>
                  )}

                  {/* Line total */}
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>
                      {item.quantity} × KES {unitPrice.toLocaleString()}
                    </span>
                    <span className="font-medium text-foreground">
                      KES {(unitPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* ── Footer — always pinned to bottom ──────────────────────────── */}
      <div className="shrink-0 pt-3 space-y-3">
        <Separator />

        {/* Order summary */}
        <div className="space-y-1.5 text-sm px-1">
          <div className="flex justify-between text-muted-foreground">
            <span>
              {items.length} line{items.length !== 1 ? "s" : ""}
            </span>
            <span>
              {count} unit{count !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span>KES {total().toLocaleString()}</span>
          </div>
          {(hasInvalidPrices || isEditingInvalidPrice) && (
            <p className="text-xs text-destructive text-center mt-1">
              ⚠️ {hasInvalidPrices && "Some items have invalid prices. "}
              {isEditingInvalidPrice &&
                "Please fix the current price before checkout."}
            </p>
          )}
        </div>

        {/* Checkout button */}
        <Button
          className="w-full"
          size="lg"
          disabled={shouldDisableCheckout}
          onClick={onCheckout}
        >
          Checkout
          {count > 0 && !shouldDisableCheckout && (
            <Badge
              variant="secondary"
              className="ml-2 text-xs bg-white/20 text-white border-0"
            >
              {count}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}
