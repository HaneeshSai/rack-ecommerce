"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// The cart keeps a display snapshot only. The server re-reads prices from the
// database at checkout, so a tampered cart can't change what is charged.
export type CartItem = {
  variantId: string;
  name: string;
  sku: string;
  label: string;
  price: number; // paise, display only
  gstRate: number;
  qty: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "rack-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      add: (item, qty = 1) =>
        setItems((cur) => {
          const found = cur.find((i) => i.variantId === item.variantId);
          if (found) return cur.map((i) => (i.variantId === item.variantId ? { ...i, qty: i.qty + qty } : i));
          return [...cur, { ...item, qty }];
        }),
      setQty: (id, qty) =>
        setItems((cur) => cur.map((i) => (i.variantId === id ? { ...i, qty: Math.max(1, qty) } : i))),
      remove: (id) => setItems((cur) => cur.filter((i) => i.variantId !== id)),
      clear: () => setItems([]),
    }),
    [items],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
