"use client";

import { useState } from "react";
import clsx from "clsx";
import { Badge, Button, Card, inputCls } from "@/components/ui";
import { inr } from "@/lib/money";
import { fmtDateTime } from "@/components/admin/format";
import { useToast } from "@/components/admin/toast";

type Row = { id: string; name: string; sku: string; manufactured: boolean; cost: number; qty: Record<string, number> };
type Move = { id: string; item: string; wh: string; delta: number; type: string; reason: string; by: string; at: string };
type Transfer = { id: string; item: string; variantId: string; from: string; to: string; qty: number; status: string; at: string };

const TABS = ["Levels", "Movements", "Transfers", "Production"] as const;
const REASONS = [
  ["RECEIPT", "Goods received"], ["DAMAGE", "Damage write-off"], ["ADJUSTMENT", "Stock count correction"],
] as const;

export function StockManager({
  warehouses, allWarehouses, rows: initialRows, movements: initialMoves, transfers: initialTransfers, lowStock, staffName, ownHub,
}: {
  warehouses: { code: string; city: string }[]; allWarehouses: string[]; rows: Row[]; movements: Move[]; transfers: Transfer[];
  lowStock: number; staffName: string; ownHub: string | null;
}) {
  const toast = useToast();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Levels");
  const [rows, setRows] = useState(initialRows);
  const [moves, setMoves] = useState(initialMoves);
  const [transfers, setTransfers] = useState(initialTransfers);
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);

  const [adj, setAdj] = useState({ variantId: initialRows[0]?.id ?? "", wh: ownHub ?? warehouses[0]?.code ?? "", delta: 1, reason: "RECEIPT" });
  const [tr, setTr] = useState({ variantId: initialRows[0]?.id ?? "", from: ownHub ?? allWarehouses[0], to: allWarehouses[1] ?? allWarehouses[0], qty: 1 });
  const [prod, setProd] = useState({ variantId: initialRows.find((r) => r.manufactured)?.id ?? "", wh: ownHub ?? warehouses[0]?.code ?? "", qty: 1 });

  const name = (id: string) => rows.find((r) => r.id === id)?.name ?? "";
  const bump = (id: string, wh: string, d: number) =>
    setRows((c) => c.map((r) => (r.id === id ? { ...r, qty: { ...r.qty, [wh]: Math.max(0, (r.qty[wh] ?? 0) + d) } } : r)));
  const log = (variantId: string, wh: string, delta: number, type: string, reason: string) =>
    setMoves((c) => [{ id: `m-${Date.now()}-${Math.random()}`, item: name(variantId), wh, delta, type, reason, by: staffName, at: new Date().toISOString() }, ...c]);

  const shown = rows.filter((r) => {
    if (search && !(r.name + r.sku).toLowerCase().includes(search.toLowerCase())) return false;
    if (lowOnly && !warehouses.some((w) => (r.qty[w.code] ?? 0) < lowStock)) return false;
    return true;
  });
  const lowCount = rows.reduce((n, r) => n + warehouses.filter((w) => (r.qty[w.code] ?? 0) < lowStock).length, 0);

  const applyAdj = () => {
    const d = adj.reason === "DAMAGE" ? -Math.abs(adj.delta) : adj.delta;
    if (!d) return toast("Enter a quantity.");
    bump(adj.variantId, adj.wh, d);
    const label = REASONS.find((r) => r[0] === adj.reason)![1];
    log(adj.variantId, adj.wh, d, adj.reason, label);
    toast(`${d > 0 ? "+" : ""}${d} at ${adj.wh}: ${label}. Logged.`);
  };
  const applyTransfer = () => {
    if (tr.from === tr.to) return toast("Choose two different hubs.");
    if ((rows.find((r) => r.id === tr.variantId)?.qty[tr.from] ?? 0) < tr.qty) return toast("Not enough stock at the source hub.");
    bump(tr.variantId, tr.from, -tr.qty);
    log(tr.variantId, tr.from, -tr.qty, "TRANSFER_OUT", `Transfer to ${tr.to}`);
    setTransfers((c) => [{ id: `t-${Date.now()}`, item: name(tr.variantId), variantId: tr.variantId, from: tr.from, to: tr.to, qty: tr.qty, status: "IN_TRANSIT", at: new Date().toISOString() }, ...c]);
    toast("Transfer started. Stock shows as in transit until received.");
  };
  const receive = (t: Transfer) => {
    bump(t.variantId, t.to, t.qty);
    log(t.variantId, t.to, t.qty, "TRANSFER_IN", `Received from ${t.from}`);
    setTransfers((c) => c.map((x) => (x.id === t.id ? { ...x, status: "RECEIVED" } : x)));
    toast(`Received ${t.qty} at ${t.to}.`);
  };
  const addProduction = () => {
    if (!prod.variantId || prod.qty < 1) return toast("Choose an item and quantity.");
    bump(prod.variantId, prod.wh, prod.qty);
    log(prod.variantId, prod.wh, prod.qty, "PRODUCTION", "Finished goods from workshop");
    toast(`Added ${prod.qty} finished units at ${prod.wh}.`);
  };

  const itemSelect = (value: string, onChange: (v: string) => void, list: Row[] = rows) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls + " mt-1"}>
      {list.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.sku})</option>)}
    </select>
  );
  const hubSelect = (value: string, onChange: (v: string) => void, list: string[]) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls + " mt-1"}>
      {list.map((w) => <option key={w}>{w}</option>)}
    </select>
  );
  const inTransit = transfers.filter((t) => t.status === "IN_TRANSIT");

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={clsx("rounded-full border px-4 py-1.5 text-sm font-medium", tab === t ? "border-accent bg-accent text-white" : "border-line bg-white hover:border-accent")}>
            {t}{t === "Transfers" && inTransit.length > 0 ? ` (${inTransit.length} in transit)` : ""}
          </button>
        ))}
      </div>

      {tab === "Levels" && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product or SKU" className={inputCls + " max-w-xs"} />
            <label className="flex items-center gap-2"><input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} /> Low stock only</label>
            <Badge tone={lowCount ? "red" : "green"}>{lowCount} low-stock lines (below {lowStock})</Badge>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-slate-50 text-left text-xs uppercase text-muted">
                <tr>
                  <th className="p-3">Product</th><th className="p-3">SKU</th>
                  {warehouses.map((w) => <th key={w.code} className="p-3 text-right">{w.city}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((r) => (
                  <tr key={r.id}>
                    <td className="p-3">{r.name}{r.manufactured && <span className="ml-2"><Badge tone="gray">made in-house</Badge></span>}</td>
                    <td className="p-3 text-muted">{r.sku}</td>
                    {warehouses.map((w) => {
                      const q = r.qty[w.code] ?? 0;
                      return <td key={w.code} className={clsx("p-3 text-right font-semibold", q < lowStock && "bg-red-50 text-red-700")}>{q}{q < lowStock && <span className="ml-1 text-xs font-normal">low</span>}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card className="mt-6 space-y-3 p-5 text-sm">
            <h2 className="font-bold">Manual adjustment</h2>
            <div className="grid gap-3 sm:grid-cols-4">
              <label className="font-medium sm:col-span-2">Item{itemSelect(adj.variantId, (v) => setAdj({ ...adj, variantId: v }))}</label>
              <label className="font-medium">Hub{hubSelect(adj.wh, (v) => setAdj({ ...adj, wh: v }), warehouses.map((w) => w.code))}</label>
              <label className="font-medium">Quantity
                <input type="number" min={1} value={adj.delta} onChange={(e) => setAdj({ ...adj, delta: Math.max(1, Number(e.target.value) || 1) })} className={inputCls + " mt-1"} />
              </label>
              <label className="font-medium sm:col-span-2">Reason
                <select value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} className={inputCls + " mt-1"}>
                  {REASONS.map(([k, l]) => <option key={k} value={k}>{l}{k === "DAMAGE" ? " (subtracts)" : k === "RECEIPT" ? " (adds)" : ""}</option>)}
                </select>
              </label>
              <div className="flex items-end"><Button onClick={applyAdj}>Apply</Button></div>
            </div>
          </Card>
        </>
      )}

      {tab === "Movements" && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-slate-50 text-left text-xs uppercase text-muted">
              <tr><th className="p-3">When</th><th className="p-3">Item</th><th className="p-3">Hub</th><th className="p-3 text-right">Change</th><th className="p-3">Type</th><th className="p-3">Reason</th><th className="p-3">By</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {moves.map((m) => (
                <tr key={m.id}>
                  <td className="p-3 text-muted">{fmtDateTime(m.at)}</td><td className="p-3">{m.item}</td><td className="p-3">{m.wh}</td>
                  <td className={clsx("p-3 text-right font-semibold", m.delta < 0 ? "text-red-600" : "text-emerald-600")}>{m.delta > 0 ? "+" : ""}{m.delta}</td>
                  <td className="p-3"><Badge tone="gray">{m.type.replace("_", " ").toLowerCase()}</Badge></td>
                  <td className="p-3 text-muted">{m.reason}</td><td className="p-3 text-muted">{m.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "Transfers" && (
        <div className="space-y-5">
          <Card className="space-y-3 p-5 text-sm">
            <h2 className="font-bold">Transfer between hubs</h2>
            <div className="grid gap-3 sm:grid-cols-5">
              <label className="font-medium sm:col-span-2">Item{itemSelect(tr.variantId, (v) => setTr({ ...tr, variantId: v }))}</label>
              <label className="font-medium">From{hubSelect(tr.from, (v) => setTr({ ...tr, from: v }), allWarehouses)}</label>
              <label className="font-medium">To{hubSelect(tr.to, (v) => setTr({ ...tr, to: v }), allWarehouses)}</label>
              <label className="font-medium">Qty
                <input type="number" min={1} value={tr.qty} onChange={(e) => setTr({ ...tr, qty: Math.max(1, Number(e.target.value) || 1) })} className={inputCls + " mt-1"} />
              </label>
            </div>
            <Button onClick={applyTransfer}>Start transfer</Button>
          </Card>
          <Card className="divide-y divide-line">
            {transfers.length === 0 && <p className="p-5 text-sm text-muted">No transfers yet.</p>}
            {transfers.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <span><b>{t.qty} x</b> {t.item}<span className="block text-xs text-muted">{t.from} &rarr; {t.to} - {fmtDateTime(t.at)}</span></span>
                {t.status === "IN_TRANSIT" ? <Button variant="ghost" onClick={() => receive(t)}>Mark received</Button> : <Badge tone="green">received</Badge>}
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === "Production" && (
        <Card className="max-w-2xl space-y-3 p-5 text-sm">
          <h2 className="font-bold">Production entry (made in-house items)</h2>
          <p className="text-muted">Adds finished stock to a hub when the workshop completes a batch.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="font-medium sm:col-span-3">Item{itemSelect(prod.variantId, (v) => setProd({ ...prod, variantId: v }), rows.filter((r) => r.manufactured))}</label>
            <label className="font-medium">Hub{hubSelect(prod.wh, (v) => setProd({ ...prod, wh: v }), warehouses.map((w) => w.code))}</label>
            <label className="font-medium">Finished qty
              <input type="number" min={1} value={prod.qty} onChange={(e) => setProd({ ...prod, qty: Math.max(1, Number(e.target.value) || 1) })} className={inputCls + " mt-1"} />
            </label>
            <div className="flex items-end"><Button onClick={addProduction}>Add to stock</Button></div>
          </div>
          <p className="text-xs text-muted">Stock value shown in Reports uses dealer price as a cost proxy ({inr(rows[0]?.cost ?? 0)} for the first item).</p>
        </Card>
      )}
    </>
  );
}
