import { create } from "zustand";
import { CartItem, Product } from "@/types";
import { toast } from "sonner";

type CartStore = {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  updatePrice: (productId: string, price: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (product) => {
    console.log("[Cart] addItem called for:", product.name, "ID:", product.id);
    const stockQty = product.stock?.quantity ?? 0;
    console.log("[Cart] Stock quantity:", stockQty);

    // Block adding if out of stock
    if (stockQty === 0) {
      console.log("[Cart] Blocked - out of stock");
      return;
    }

    const existing = get().items.find((i) => i.product.id === product.id);
    console.log("[Cart] Existing item:", existing);

    if (existing) {
      // Block incrementing beyond available stock
      if (existing.quantity >= stockQty) {
        console.log("[Cart] Blocked - exceeds stock");
        toast.error(
          `Only ${stockQty} unit${stockQty !== 1 ? "s" : ""} available for "${product.name}"`,
        );
        return;
      }
      console.log("[Cart] Incrementing quantity");
      set((s) => ({
        items: s.items.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      }));
    } else {
      console.log("[Cart] Adding new item");
      set((s) => ({ items: [...s.items, { product, quantity: 1 }] }));
    }
    console.log("[Cart] Current cart items:", get().items);
  },

  removeItem: (productId) =>
    set((s) => ({ items: s.items.filter((i) => i.product.id !== productId) })),

  updateQuantity: (productId, qty) => {
    if (qty <= 0) {
      get().removeItem(productId);
      return;
    }

    const item = get().items.find((i) => i.product.id === productId);
    const stockQty = item?.product.stock?.quantity ?? 0;

    // Cap at available stock
    if (qty > stockQty) {
      toast.error(
        `Only ${stockQty} unit${stockQty !== 1 ? "s" : ""} available`,
      );
      return;
    }

    set((s) => ({
      items: s.items.map((i) =>
        i.product.id === productId ? { ...i, quantity: qty } : i,
      ),
    }));
  },

  // Update custom price
  updatePrice: (productId, price) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId ? { ...i, customPrice: price } : i,
      ),
    })),

  clearCart: () => set({ items: [] }),

  total: () =>
    get().items.reduce((sum, i) => {
      const unitPrice = i.customPrice ?? i.product.price;
      return sum + unitPrice * i.quantity;
    }, 0),
  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
