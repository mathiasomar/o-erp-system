"use client";

import { useState } from "react";
// import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Order } from "@/types";
import { Search, ShoppingCart } from "lucide-react";
import { AutoPrintReceipt } from "@/components/pos/AutoPrintReceipt";
import { useCategories } from "@/hooks/use-category";
import { useProducts } from "@/hooks/use-product";
import { useCartStore } from "@/store/cart";
import { ProductCard } from "@/components/ProductCard";
import { CartPanel } from "@/components/CartPanel";
import { CheckoutModal } from "@/components/pos/CheckoutModal";
import { ReceiptModal } from "@/components/orders/ReceiptModal";
import { ScrollArea } from "@/components/ui/scroll-area";
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbList,
//   BreadcrumbPage,
//   BreadcrumbSeparator,
// } from "@/components/ui/breadcrumb";
import { ProductSearch } from "@/components/pos/ProductSearch";
import { useKeyboardScanner } from "@/hooks/use-keyboard-scanner";
import { getProductByBarcode } from "@/actions/barcode.action";
import { toast } from "sonner";
import { BarcodeTest } from "@/components/pos/BarcodeTest";

export default function POSPage() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | undefined>(undefined);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useProducts(search, activeCat);
  const { itemCount, total, addItem } = useCartStore();

  const count = itemCount();
  const orderTotal = total();

  function handleOrderSuccess(order: Order) {
    setReceiptOrder(order);
    setCompletedOrder(order);
  }

  useKeyboardScanner(async (barcode) => {
    console.log("[POS] ==================================");
    console.log("[POS] Barcode detected:", barcode);
    
    try {
      console.log("[POS] Calling getProductByBarcode with:", barcode);
      const { product } = await getProductByBarcode(barcode);
      console.log("[POS] Product lookup result:", product);
      console.log("[POS] Product stock:", product?.stock?.quantity);
      console.log("[POS] Product isActive:", product?.isActive);
      
      if (product && (product.stock?.quantity ?? 0) > 0) {
        console.log("[POS] Adding product to cart:", product.name, "ID:", product.id);
        console.log("[POS] Cart before add:", { itemCount: itemCount(), total: total() });
        addItem(product);
        console.log("[POS] Cart after add:", { itemCount: itemCount(), total: total() });
        toast.success(`Added: ${product.name}`);
      } else if (product) {
        console.log("[POS] Product out of stock:", product.name, "Stock:", product.stock?.quantity);
        toast.error(`"${product.name}" is out of stock`);
      } else {
        console.log("[POS] No product found for barcode:", barcode);
        toast.error(`No product found for barcode: ${barcode}`);
      }
    } catch (error) {
      console.error("[POS] Error processing barcode:", error);
      toast.error("Error processing barcode");
    }
  }, true);

  return (
    <div className="space-y-4">
      {/* Scanner Status Indicator */}
      <div className="hidden p-2 bg-green-50 text-green-700 text-xs">
        Barcode Scanner Active - Click outside search box to scan
      </div>
      
      {/* Barcode Scanner Test - Only visible for testing */}
      <div className="hidden">
        <BarcodeTest />
      </div>
      
      {/* Breadcrambs */}
      {/* <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>POS</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb> */}
      <div className="flex overflow-hidden">
        {/* ── Left — product catalog ─────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden gap-4">
          {/* Search + categories header */}
          <div className="shrink-0 p-3 space-y-4 border-b bg-background">
            {/* Search bar */}
            {/* <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-muted-foreground"
                size={15}
              />
              <Input
                placeholder="Search by name, SKU or scan barcode..."
                className="pl-9 pr-4"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div> */}
            <ProductSearch search={search} onSearch={setSearch} />

            {/* Category filter — horizontally scrollable on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <Badge
                variant={!activeCat ? "default" : "outline"}
                className="cursor-pointer shrink-0"
                onClick={() => setActiveCat(undefined)}
              >
                All
              </Badge>
              {categories.map((cat) => (
                <Badge
                  key={cat.id}
                  variant={activeCat === cat.id ? "default" : "outline"}
                  className="cursor-pointer shrink-0"
                  style={
                    activeCat === cat.id
                      ? { backgroundColor: cat.color ?? "" }
                      : {}
                  }
                  onClick={() => setActiveCat(cat.id)}
                >
                  {cat.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Product grid — scrollable */}
          {/* ── Mobile floating cart button ─────────────────────────────── */}
          {count > 0 && (
            <div
              className="lg:hidden
                          px-3
                          bg-linear-to-t from-background via-background/95 to-transparent transition-all duration-300"
            >
              <Button
                className="w-full shadow-lg"
                size="lg"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart size={16} className="mr-2" />
                View Cart
                <Badge
                  variant="secondary"
                  className="ml-2 bg-white/20 text-white border-0"
                >
                  {count}
                </Badge>
                <span className="ml-auto font-bold">
                  KES {orderTotal.toLocaleString()}
                </span>
              </Button>
            </div>
          )}
          <ScrollArea className="flex-1 min-h-0 max-h-[75vh] px-2 pt-2 pb-4">
            {isLoading ? (
              <div className="product-grid gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center
                            h-full gap-2 text-muted-foreground"
              >
                <Search size={32} className="opacity-30" />
                <p className="text-sm">No products found</p>
              </div>
            ) : (
              <div className="product-grid p-2 gap-2">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* ── Right — desktop cart sidebar ──────────────────────────────── */}
        <div className="hidden lg:flex flex-col w-80 border-l bg-muted/30 p-4 h-[80%]">
          <CartPanel onCheckout={() => setCheckoutOpen(true)} />
        </div>

        {/* ── Mobile — cart sheet ────────────────────────────────────────── */}
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetContent
            side="right"
            className="w-full sm:w-96 p-0 flex flex-col"
          >
            <SheetHeader className="px-4 pt-4 pb-0">
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart size={16} />
                Cart
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 min-h-0 p-4">
              <CartPanel
                onCheckout={() => {
                  setCartOpen(false);
                  setCheckoutOpen(true);
                }}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* ── Checkout modal ─────────────────────────────────────────────── */}
        <CheckoutModal
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={handleOrderSuccess}
        />

        {/* ── Receipt modal ──────────────────────────────────────────────── */}
        <ReceiptModal
          open={!!receiptOrder}
          onClose={() => setReceiptOrder(null)}
          order={receiptOrder}
        />
        <AutoPrintReceipt
          order={completedOrder}
          onDone={() => setCompletedOrder(null)}
        />
      </div>
    </div>
  );
}
