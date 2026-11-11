// Server-side helper: per-variant pricing/shipping/stock facts handed to the
// client cart and checkout (the cart itself only stores a retail display price).
import { mock } from "@/lib/db";
import type { ShippingClass } from "@/lib/logistics";

export type PriceInfo = {
  retail: number;
  dealer: number;
  gstRate: number;
  shipping: ShippingClass;
  moq: number;
  stock: Record<string, number>; // warehouse code -> qty (used for the mock routing line)
};

export function buildPriceMap(): Record<string, PriceInfo> {
  const s = mock.S();
  const code = new Map(s.warehouses.map((w) => [w.id, w.code]));
  const map: Record<string, PriceInfo> = {};
  for (const v of s.variants) {
    const p = s.products.find((x) => x.id === v.productId)!;
    const stock: Record<string, number> = {};
    for (const r of s.stock) if (r.variantId === v.id) stock[code.get(r.warehouseId)!] = r.qty;
    map[v.id] = { retail: v.retailPrice, dealer: v.dealerPrice, gstRate: p.gstRate, shipping: v.shippingClass, moq: v.moq, stock };
  }
  return map;
}
