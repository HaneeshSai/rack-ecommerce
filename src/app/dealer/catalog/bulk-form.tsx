"use client";

import { useActionState } from "react";
import { Button, Card } from "@/components/ui";
import { placeDealerOrder } from "@/lib/actions/dealer";
import { inr } from "@/lib/money";

type Row = { id: string; name: string; label: string; sku: string; retail: number; dealer: number; stock: number };

export function BulkOrderForm({ rows }: { rows: Row[] }) {
  const [state, action, pending] = useActionState(placeDealerOrder, undefined);
  return (
    <form action={action}>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-slate-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="p-3">Product</th><th className="p-3">SKU</th>
              <th className="p-3 text-right">Retail</th><th className="p-3 text-right">Your price</th>
              <th className="p-3 text-right">Stock</th><th className="p-3">Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="p-3">{r.name} <span className="text-muted">({r.label})</span></td>
                <td className="p-3 text-muted">{r.sku}</td>
                <td className="p-3 text-right text-muted line-through">{inr(r.retail)}</td>
                <td className="p-3 text-right font-semibold">{inr(r.dealer)}</td>
                <td className="p-3 text-right">{r.stock}</td>
                <td className="p-3">
                  <input
                    name={`qty_${r.id}`} type="number" min={0} max={r.stock} defaultValue={0}
                    className="w-20 rounded-lg border border-line px-2 py-1.5"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="mt-4 flex items-center gap-4">
        <Button type="submit" disabled={pending}>{pending ? "Placing..." : "Place order on credit"}</Button>
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
        <span className="text-xs text-muted">Prices exclude 18% GST.</span>
      </div>
    </form>
  );
}
