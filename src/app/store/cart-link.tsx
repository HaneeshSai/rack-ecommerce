"use client";

import Link from "next/link";
import { ShoppingCart } from "@/components/icons";
import { useCart } from "@/components/cart";

export function CartLink() {
  const { count } = useCart();
  return (
    <Link href="/cart" className="relative inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-slate-50">
      <ShoppingCart size={16} /> Cart
      {count > 0 && (
        <span className="rounded-full bg-accent px-2 text-xs text-white">{count}</span>
      )}
    </Link>
  );
}
