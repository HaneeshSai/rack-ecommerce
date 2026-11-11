"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { Badge, Card, inputCls } from "@/components/ui";
import { fmtDate, type Tone } from "@/components/admin/format";
import { useToast } from "@/components/admin/toast";

type Ticket = {
  id: string; number: string; type: string; status: string; orderNumber: string | null; subject: string;
  message: string; assignedTo: string; createdAt: string; dealer: string;
};
const STATUS_TONE: Record<string, Tone> = { OPEN: "red", IN_PROGRESS: "amber", RESOLVED: "green" };
const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"];

export function TicketPanel({ initial, staff }: { initial: Ticket[]; staff: string[] }) {
  const toast = useToast();
  const [tickets, setTickets] = useState(initial);
  const [sel, setSel] = useState(initial[0]?.id ?? null);
  const [filter, setFilter] = useState("");
  const t = tickets.find((x) => x.id === sel);
  const patch = (id: string, p: Partial<Ticket>) => setTickets((c) => c.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const list = tickets.filter((x) => !filter || x.status === filter);

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className={inputCls + " mb-3"}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ").toLowerCase()}</option>)}
        </select>
        <div className="space-y-2">
          {list.map((x) => (
            <button
              key={x.id}
              onClick={() => setSel(x.id)}
              className={clsx("w-full rounded-xl border bg-white p-3 text-left text-sm shadow-sm transition", sel === x.id ? "border-accent" : "border-line hover:border-slate-300")}
            >
              <div className="flex items-center justify-between gap-2">
                <b>{x.number}</b><Badge tone={STATUS_TONE[x.status]}>{x.status.replace("_", " ").toLowerCase()}</Badge>
              </div>
              <div className="mt-1">{x.subject}</div>
              <div className="mt-1 text-xs text-muted">{x.dealer} - {x.type.toLowerCase()} - {fmtDate(x.createdAt)}</div>
            </button>
          ))}
          {list.length === 0 && <p className="text-sm text-muted">No tickets.</p>}
        </div>
      </div>

      {t ? (
        <Card className="h-fit space-y-4 p-5 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">{t.number}: {t.subject}</h2>
            <Badge tone="gray">{t.type.toLowerCase()}</Badge>
          </div>
          <p className="rounded-lg bg-slate-50 p-3">{t.message}</p>
          <dl className="grid grid-cols-2 gap-3">
            <div><dt className="text-xs text-muted">Raised by</dt><dd className="font-semibold">{t.dealer}</dd></div>
            <div><dt className="text-xs text-muted">Linked order</dt><dd className="font-semibold">{t.orderNumber ? <Link href={`/orders/${t.orderNumber}`} className="text-accent hover:underline">{t.orderNumber}</Link> : "None"}</dd></div>
          </dl>
          <div className="grid grid-cols-2 gap-3">
            <label className="font-medium">Status
              <select value={t.status} onChange={(e) => { patch(t.id, { status: e.target.value }); toast(`${t.number} marked ${e.target.value.replace("_", " ").toLowerCase()}.`); }} className={inputCls + " mt-1"}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ").toLowerCase()}</option>)}
              </select>
            </label>
            <label className="font-medium">Assigned to
              <select value={t.assignedTo} onChange={(e) => { patch(t.id, { assignedTo: e.target.value }); toast(`Assigned to ${e.target.value}.`); }} className={inputCls + " mt-1"}>
                {staff.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>
          {(t.type === "DAMAGE" || t.type === "RETURN") && (
            <p className="text-xs text-muted">Approved returns put stock back or write it off as damaged (Stock page, adjustment with reason).</p>
          )}
        </Card>
      ) : (
        <Card className="p-8 text-center text-muted">Select a ticket.</Card>
      )}
    </div>
  );
}
