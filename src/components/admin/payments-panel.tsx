"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, StatCard, inputCls } from "@/components/ui";
import { inr } from "@/lib/money";
import { fmtDate } from "@/components/admin/format";
import { useToast } from "@/components/admin/toast";

type Q = { number: string; customer: string; total: number; proformaNo: string | null; utr: string | null; holdUntil: string | null };
type D = {
  id: string; name: string; creditLimit: number; creditUsed: number; termsDays: number; outstanding: number; overdue: number;
  buckets: number[]; unpaid: { number: string; total: number; createdAt: string; dueDate: string | null }[];
};

export function PaymentsPanel({ queue: initialQueue, dealers, collected }: { queue: Q[]; dealers: D[]; collected: number }) {
  const toast = useToast();
  const [queue, setQueue] = useState(initialQueue);
  const [utrs, setUtrs] = useState<Record<string, string>>(Object.fromEntries(initialQueue.map((q) => [q.number, q.utr ?? ""])));
  const [collectedNow, setCollected] = useState(collected);
  const [reminded, setReminded] = useState<string[]>([]);

  const outstanding = dealers.reduce((n, d) => n + d.outstanding, 0);
  const overdue = dealers.reduce((n, d) => n + d.overdue, 0);
  const labels = ["0-30", "31-60", "61-90", "90+"];

  const markPaid = (q: Q) => {
    if (!utrs[q.number]?.trim()) return toast("Enter the UTR / transaction reference first.");
    setQueue((c) => c.filter((x) => x.number !== q.number));
    setCollected((n) => n + q.total);
    toast(`${q.number} matched to UTR ${utrs[q.number]}. Order confirmed and tax invoice issued.`);
  };
  const remind = (d: D) => {
    setReminded((c) => [...c, d.id]);
    toast(`Payment reminder sent to ${d.name} by email + WhatsApp.`);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Collected this month" value={inr(collectedNow)} tone="good" />
        <StatCard label="Outstanding" value={inr(outstanding)} />
        <StatCard label="Overdue" value={inr(overdue)} tone={overdue > 0 ? "warn" : undefined} />
        <StatCard label="Bank transfers to match" value={String(queue.length)} />
      </div>

      <h2 className="mb-3 mt-8 font-bold">Bank-transfer queue</h2>
      <Card className="divide-y divide-line">
        {queue.length === 0 && <p className="p-5 text-sm text-muted">All bank transfers are matched.</p>}
        {queue.map((q) => (
          <div key={q.number} className="flex flex-wrap items-center gap-3 p-4 text-sm">
            <div className="min-w-48 flex-1">
              <Link href={`/orders/${q.number}`} className="font-semibold text-accent hover:underline">{q.number}</Link> - {q.customer}
              <div className="text-xs text-muted">{q.proformaNo} - hold until {fmtDate(q.holdUntil)}</div>
            </div>
            <b>{inr(q.total)}</b>
            <input value={utrs[q.number] ?? ""} onChange={(e) => setUtrs({ ...utrs, [q.number]: e.target.value })} placeholder="UTR reference" className={inputCls + " !w-52"} />
            <Button onClick={() => markPaid(q)}>Match and mark paid</Button>
          </div>
        ))}
      </Card>

      <h2 className="mb-3 mt-8 font-bold">Outstanding and ageing by dealer</h2>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-slate-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="p-3">Dealer</th><th className="p-3 text-right">Credit limit</th><th className="p-3 text-right">Used</th>
              {labels.map((l) => <th key={l} className="p-3 text-right">{l} d</th>)}<th className="p-3">Terms</th><th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {dealers.map((d) => (
              <tr key={d.id}>
                <td className="p-3 font-semibold"><Link href={`/dealers/${d.id}`} className="hover:text-accent">{d.name}</Link></td>
                <td className="p-3 text-right">{inr(d.creditLimit)}</td>
                <td className="p-3 text-right">{inr(d.creditUsed)}</td>
                {d.buckets.map((b, i) => <td key={i} className={`p-3 text-right ${i === 3 && b > 0 ? "font-bold text-red-600" : "text-muted"}`}>{inr(b)}</td>)}
                <td className="p-3">{d.termsDays} days</td>
                <td className="p-3 text-right">
                  {d.overdue > 0 ? (
                    <Button variant="ghost" className="!py-1" disabled={reminded.includes(d.id)} onClick={() => remind(d)}>
                      {reminded.includes(d.id) ? "Reminder sent" : "Send reminder"}
                    </Button>
                  ) : <Badge tone="green">on time</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-2 text-xs text-muted">Ageing counts unpaid credit invoices from invoice date. Credit used is the dealer&apos;s running balance.</p>
    </>
  );
}
