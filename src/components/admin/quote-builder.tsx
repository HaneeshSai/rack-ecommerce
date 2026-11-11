"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card, inputCls } from "@/components/ui";
import { inr, inr2 } from "@/lib/money";
import { useToast } from "@/components/admin/toast";

type Opt = { id: string; name: string };
type Cat = { id: string; name: string; sku: string; price: number; gstRate: number };
type Line = { variantId: string; qty: number; price: number }; // price in rupees

export function QuoteBuilder({
  dealers, leads, catalogue, threshold, role, defaultValidUntil, quoteNumber,
}: {
  dealers: Opt[]; leads: Opt[]; catalogue: Cat[]; threshold: number; role: string; defaultValidUntil: string; quoteNumber: string;
}) {
  const toast = useToast();
  const [partyType, setPartyType] = useState<"dealer" | "lead">("dealer");
  const [partyId, setPartyId] = useState(dealers[0]?.id ?? "");
  const [lines, setLines] = useState<Line[]>([]);
  const [pick, setPick] = useState("");
  const [search, setSearch] = useState("");
  const [discount, setDiscount] = useState(0);
  const [valid, setValid] = useState(defaultValidUntil);
  const [version, setVersion] = useState(1);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PENDING_APPROVAL" | "SENT">("DRAFT");

  const byId = useMemo(() => new Map(catalogue.map((c) => [c.id, c])), [catalogue]);
  const options = catalogue.filter((c) => !search || (c.name + c.sku).toLowerCase().includes(search.toLowerCase())).slice(0, 80);

  // The discount applies on top of per-line custom prices; list-price discount is what gets approved.
  const listTotal = lines.reduce((n, l) => n + (byId.get(l.variantId)?.price ?? 0) / 100 * l.qty, 0);
  const lineTotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const afterDiscount = lineTotal * (1 - discount / 100);
  const effectivePct = listTotal > 0 ? Math.max(0, Math.round(((1 - afterDiscount / listTotal) * 100) * 10) / 10) : 0;
  const needsApproval = effectivePct > threshold;
  const gst = afterDiscount * 0.18;
  const parties = partyType === "dealer" ? dealers : leads;

  const add = () => {
    const c = byId.get(pick);
    if (!c) return;
    setLines((cur) => (cur.some((l) => l.variantId === c.id) ? cur : [...cur, { variantId: c.id, qty: 1, price: c.price / 100 }]));
    setPick("");
  };
  const patch = (id: string, p: Partial<Line>) => setLines((c) => c.map((l) => (l.variantId === id ? { ...l, ...p } : l)));

  const send = (channel: string) => {
    if (lines.length === 0) return toast("Add at least one item.");
    if (needsApproval && role !== "ADMIN") {
      setStatus("PENDING_APPROVAL");
      return toast(`Discount ${effectivePct}% is above ${threshold}%. Sent to manager for approval.`);
    }
    setStatus("SENT");
    toast(`${quoteNumber} v${version} sent by ${channel} with a link to accept it in the dealer portal.`);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        <Card className="grid gap-3 p-5 text-sm sm:grid-cols-3">
          <label className="font-medium">Quote for
            <select value={partyType} onChange={(e) => { const t = e.target.value as "dealer" | "lead"; setPartyType(t); setPartyId((t === "dealer" ? dealers : leads)[0]?.id ?? ""); }} className={inputCls + " mt-1"}>
              <option value="dealer">Approved dealer</option><option value="lead">CRM lead</option>
            </select>
          </label>
          <label className="font-medium sm:col-span-2">{partyType === "dealer" ? "Dealer" : "Lead"}
            <select value={partyId} onChange={(e) => setPartyId(e.target.value)} className={inputCls + " mt-1"}>
              {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="font-medium">Valid until
            <input type="date" value={valid} onChange={(e) => setValid(e.target.value)} className={inputCls + " mt-1"} />
          </label>
          <label className="font-medium sm:col-span-2">Note to customer
            <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls + " mt-1"} placeholder="Delivery in 5 working days" />
          </label>
        </Card>

        <Card className="p-5 text-sm">
          <h2 className="mb-3 font-bold">Items</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search catalogue (e.g. 42U, junction box)" className={inputCls + " !w-60"} />
            <select value={pick} onChange={(e) => setPick(e.target.value)} className={inputCls + " min-w-60 flex-1"}>
              <option value="">Choose a product...</option>
              {options.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.sku})</option>)}
            </select>
            <Button onClick={add} disabled={!pick}>Add</Button>
          </div>
          {lines.length === 0 ? (
            <p className="text-muted">No items yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-line text-left text-xs uppercase text-muted">
                  <tr><th className="py-2">Item</th><th className="py-2 text-right">List (ex GST)</th><th className="py-2">Qty</th><th className="py-2">Quoted price (Rs)</th><th className="py-2 text-right">Line total</th><th /></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {lines.map((l) => {
                    const c = byId.get(l.variantId)!;
                    return (
                      <tr key={l.variantId}>
                        <td className="py-2 pr-2">{c.name}<div className="text-xs text-muted">{c.sku}</div></td>
                        <td className="py-2 text-right text-muted">{inr(c.price)}</td>
                        <td className="py-2"><input type="number" min={1} value={l.qty} onChange={(e) => patch(l.variantId, { qty: Math.max(1, Number(e.target.value) || 1) })} className={inputCls + " !w-20"} /></td>
                        <td className="py-2"><input type="number" min={0} value={l.price} onChange={(e) => patch(l.variantId, { price: Math.max(0, Number(e.target.value) || 0) })} className={inputCls + " !w-28"} /></td>
                        <td className="py-2 text-right font-semibold">{inr2(Math.round(l.price * l.qty * 100))}</td>
                        <td className="py-2 text-right"><button onClick={() => setLines((c2) => c2.filter((x) => x.variantId !== l.variantId))} className="text-muted hover:text-red-600" aria-label="Remove">x</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Card className="h-fit space-y-3 p-5 text-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{quoteNumber} <span className="text-xs font-normal text-muted">version {version}</span></h2>
          <Badge tone={status === "SENT" ? "blue" : status === "PENDING_APPROVAL" ? "amber" : "gray"}>{status.replace("_", " ").toLowerCase()}</Badge>
        </div>
        <label className="block font-medium">Extra discount (%)
          <input type="number" min={0} max={50} value={discount} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))} className={inputCls + " mt-1"} />
        </label>
        <div className="space-y-1">
          <div className="flex justify-between"><span className="text-muted">List total</span><span>{inr2(Math.round(listTotal * 100))}</span></div>
          <div className="flex justify-between"><span className="text-muted">After custom prices and discount</span><span>{inr2(Math.round(afterDiscount * 100))}</span></div>
          <div className="flex justify-between"><span className="text-muted">GST 18%</span><span>{inr2(Math.round(gst * 100))}</span></div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><span>Total</span><span>{inr2(Math.round((afterDiscount + gst) * 100))}</span></div>
        </div>
        <div className={needsApproval ? "rounded-lg bg-amber-50 p-3 text-amber-900" : "rounded-lg bg-slate-50 p-3 text-muted"}>
          Effective discount <b>{effectivePct}%</b> (limit {threshold}%).{" "}
          {needsApproval ? "Needs manager approval." : "No approval needed."}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => send("email")} disabled={needsApproval && role !== "ADMIN" && status === "PENDING_APPROVAL"}>
            {needsApproval && role !== "ADMIN" ? "Request approval" : "Send by email"}
          </Button>
          <Button variant="ghost" onClick={() => send("WhatsApp")} disabled={needsApproval && role !== "ADMIN"}>Send by WhatsApp</Button>
        </div>
        {needsApproval && role === "ADMIN" && <p className="text-xs text-muted">You are a manager, so you can approve and send directly.</p>}
        <Button variant="ghost" onClick={() => { setVersion((v) => v + 1); setStatus("DRAFT"); toast(`Saved as version ${version + 1}. History is kept.`); }}>Save as new version</Button>
        <p className="text-xs text-muted">When the customer accepts in the portal, the quote becomes an order at these prices.</p>
      </Card>
    </div>
  );
}
