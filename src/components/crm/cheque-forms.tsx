"use client";

import { useState } from "react";
import { Button, inputCls } from "@/components/ui";
import { addCheque, setChequeStatus } from "@/lib/actions/crm";
import { useRun } from "./use-run";

export function AddCheque({ dealers, orders }: { dealers: { id: string; name: string }[]; orders: { id: string; label: string; dealerId: string }[] }) {
  const { run, pending } = useRun();
  const empty = { dealerId: "", orderId: "", chequeNo: "", bank: "", amount: "", chequeDate: new Date().toISOString().slice(0, 10) };
  const [f, setF] = useState(empty);
  const set = (k: keyof typeof empty, v: string) => setF((p) => ({ ...p, [k]: v }));
  const mine = orders.filter((o) => o.dealerId === f.dealerId);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <select className={inputCls} value={f.dealerId} onChange={(e) => setF({ ...f, dealerId: e.target.value, orderId: "" })}>
        <option value="">Dealer</option>
        {dealers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      <select className={inputCls} value={f.orderId} onChange={(e) => set("orderId", e.target.value)} disabled={!f.dealerId}>
        <option value="">For order (optional)</option>
        {mine.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
      <input className={inputCls} placeholder="Cheque number" value={f.chequeNo} onChange={(e) => set("chequeNo", e.target.value)} />
      <input className={inputCls} placeholder="Bank" value={f.bank} onChange={(e) => set("bank", e.target.value)} />
      <input className={inputCls} type="number" placeholder="Amount (Rs)" value={f.amount} onChange={(e) => set("amount", e.target.value)} />
      <input className={inputCls} type="date" value={f.chequeDate} onChange={(e) => set("chequeDate", e.target.value)} aria-label="Date on cheque" />
      <div className="sm:col-span-2 lg:col-span-3">
        <Button disabled={pending} onClick={() => run(() => addCheque({ ...f, amount: Number(f.amount) }), () => setF(empty))}>Add cheque</Button>
        <span className="ml-3 text-xs text-muted">A date after today is saved as post-dated.</span>
      </div>
    </div>
  );
}

export function ChequeActions({ id, status }: { id: string; status: string }) {
  const { run, pending } = useRun();
  const [bounce, setBounce] = useState(false);
  const [reason, setReason] = useState("");
  if (status === "RECEIVED") return <Button variant="ghost" className="!py-1.5" disabled={pending} onClick={() => run(() => setChequeStatus(id, "DEPOSITED"))}>Mark deposited</Button>;
  if (status !== "DEPOSITED") return null;
  if (bounce)
    return (
      <div className="flex gap-2">
        <input className={inputCls} placeholder="Why did it bounce?" value={reason} onChange={(e) => setReason(e.target.value)} />
        <Button variant="ghost" className="!py-1.5" disabled={pending} onClick={() => run(() => setChequeStatus(id, "BOUNCED", reason), () => setBounce(false))}>Save</Button>
      </div>
    );
  return (
    <div className="flex gap-2">
      <Button className="!py-1.5" disabled={pending} onClick={() => run(() => setChequeStatus(id, "CLEARED"))}>Cleared</Button>
      <Button variant="ghost" className="!py-1.5" onClick={() => setBounce(true)}>Bounced</Button>
    </div>
  );
}
