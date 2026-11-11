"use client";

import { useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { Badge, Button } from "@/components/ui";
import { useCart } from "@/components/cart";
import { inr } from "@/lib/money";

type V = {
  id: string; sku: string; label: string;
  depthMm: number | null; widthMm: number | null; heightMm: number | null;
  price: number; needsConfirmation: boolean;
  stock: { city: string; qty: number }[];
};

export function VariantPicker({ variants, productName, gstRate }: { variants: V[]; productName: string; gstRate: number }) {
  const [sel, setSel] = useState(variants[0].id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const cart = useCart();
  const router = useRouter();
  const v = variants.find((x) => x.id === sel)!;
  const total = v.stock.reduce((n, s) => n + s.qty, 0);

  const addToCart = () => {
    cart.add({ variantId: v.id, name: productName, sku: v.sku, label: v.label, price: v.price, gstRate }, qty);
    setAdded(true);
  };

  return (
    <div className="mt-6 space-y-5">
      {variants.length > 1 && (
        <div>
          <div className="mb-2 text-sm font-semibold">Depth</div>
          <div className="flex flex-wrap gap-2">
            {variants.map((x) => (
              <button
                key={x.id}
                onClick={() => { setSel(x.id); setAdded(false); }}
                className={clsx(
                  "rounded-lg border px-3 py-2 text-sm",
                  x.id === sel ? "border-accent bg-orange-50 font-semibold" : "border-line bg-white hover:border-accent",
                )}
              >
                {x.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-3xl font-extrabold">{inr(v.price)}</div>

      {(v.widthMm || v.depthMm || v.heightMm) && (
        <dl className="grid grid-cols-3 gap-3 text-sm">
          {[["Width", v.widthMm], ["Depth", v.depthMm], ["Height", v.heightMm]].map(([k, val]) => (
            <div key={k as string} className="rounded-lg bg-slate-100 p-3">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="font-semibold">{val ? `${val} mm` : "To confirm"}</dd>
            </div>
          ))}
        </dl>
      )}
      {v.needsConfirmation && <Badge tone="amber">Dimensions pending confirmation</Badge>}

      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          Stock <Badge tone={total > 0 ? "green" : "red"}>{total > 0 ? `${total} available` : "Out of stock"}</Badge>
        </div>
        <ul className="grid grid-cols-3 gap-2 text-sm">
          {v.stock.map((s) => (
            <li key={s.city} className="rounded-lg border border-line bg-white p-2">
              <div className="text-xs text-muted">{s.city}</div>
              <div className={s.qty > 0 ? "font-semibold" : "text-red-600"}>{s.qty > 0 ? s.qty : "0"}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="number" min={1} value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          className="w-20 rounded-lg border border-line px-3 py-2.5 text-sm"
        />
        <Button onClick={addToCart} disabled={total === 0}>Add to cart</Button>
        {added && <Button variant="dark" onClick={() => router.push("/cart")}>View cart</Button>}
      </div>
    </div>
  );
}
