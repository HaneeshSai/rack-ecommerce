"use client";

import { useState } from "react";
import { Badge, Button, Card, inputCls } from "@/components/ui";
import { dateStr } from "./format";
import { inr } from "@/lib/money";

export type QuoteView = {
  number: string; status: string; validUntil: string; createdAt: string; version: number; note: string; discountPct: number;
  items: { name: string; qty: number; unitPrice: number; listPrice: number }[];
};

export function QuotesClient({ quotes }: { quotes: QuoteView[] }) {
  const [accepted, setAccepted] = useState<Record<string, string>>({});
  const [reqOpen, setReqOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const accept = (n: string) => setAccepted((c) => ({ ...c, [n]: `RK-${10008 + Object.keys(c).length}` }));

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {quotes.map((q) => {
          const total = q.items.reduce((n, i) => n + i.unitPrice * i.qty, 0);
          const done = q.status === "ACCEPTED" || accepted[q.number];
          return (
            <Card key={q.number} className="space-y-3 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <b className="text-base">{q.number}</b>
                  <span className="ml-2 text-muted">v{q.version} - issued {dateStr(q.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {q.discountPct > 0 && <Badge tone="green">{q.discountPct}% discount</Badge>}
                  <Badge tone={done ? "green" : q.status === "EXPIRED" ? "red" : "blue"}>{done ? "Accepted" : q.status.toLowerCase()}</Badge>
                </div>
              </div>
              <ul className="divide-y divide-line">
                {q.items.map((i, idx) => (
                  <li key={idx} className="flex justify-between gap-3 py-1.5">
                    <span>{i.name} <span className="text-muted">x {i.qty}</span></span>
                    <span>
                      {i.unitPrice < i.listPrice && <span className="mr-2 text-muted line-through">{inr(i.listPrice)}</span>}
                      {inr(i.unitPrice)} <span className="text-xs text-muted">+ GST</span>
                    </span>
                  </li>
                ))}
              </ul>
              {q.note && <p className="text-muted">{q.note}</p>}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-muted">Quote total (ex-GST): </span><b>{inr(total)}</b>
                  <span className="ml-3 text-xs text-muted">Valid until {dateStr(q.validUntil)}</span>
                </div>
                {accepted[q.number] ? (
                  <span className="font-semibold text-emerald-700">Converted to order {accepted[q.number]} (demo)</span>
                ) : q.status === "SENT" ? (
                  <Button onClick={() => accept(q.number)}>Accept quote</Button>
                ) : null}
              </div>
            </Card>
          );
        })}
        {quotes.length === 0 && <p className="text-muted">No quotes yet. Request one below.</p>}
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-bold">Request a quote</h2>
            <p className="text-sm text-muted">For large or custom orders. Our sales team replies with special pricing.</p>
          </div>
          {!reqOpen && <Button variant="ghost" onClick={() => setReqOpen(true)}>New request</Button>}
        </div>
        {reqOpen && (
          sent ? (
            <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
              Request received. Your sales rep will send a quote shortly (demo).
            </p>
          ) : (
            <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
              <label className="block text-sm font-medium">What do you need?
                <textarea required rows={3} className={inputCls + " mt-1"} placeholder="e.g. 20 x 9U wall mount racks (500mm depth) and 40 PoE switch brackets" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium">Delivery city
                  <input required className={inputCls + " mt-1"} placeholder="Hyderabad" />
                </label>
                <label className="block text-sm font-medium">Needed by
                  <input type="date" className={inputCls + " mt-1"} />
                </label>
              </div>
              <Button type="submit">Send request</Button>
            </form>
          )
        )}
      </Card>
    </div>
  );
}
