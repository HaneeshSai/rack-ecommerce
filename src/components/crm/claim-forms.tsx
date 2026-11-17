"use client";

import { useState } from "react";
import { Button, inputCls } from "@/components/ui";
import { closeClaim, decideClaim, raiseClaim } from "@/lib/actions/crm";
import { useRun } from "./use-run";

export function NewClaim({ orders }: { orders: { id: string; label: string }[] }) {
  const { run, pending } = useRun();
  const empty = { orderId: "", kind: "DAMAGED" as "DAMAGED" | "MISSING" | "WRONG_ITEM", item: "", qty: "1", note: "", hours: "", photos: "0" };
  const [f, setF] = useState(empty);
  const set = (k: keyof typeof empty, v: string) => setF((p) => ({ ...p, [k]: v }));
  const late = Number(f.hours) > 48;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <select className={inputCls} value={f.orderId} onChange={(e) => set("orderId", e.target.value)}>
        <option value="">Which order?</option>
        {orders.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
      <select className={inputCls} value={f.kind} onChange={(e) => set("kind", e.target.value)}>
        <option value="DAMAGED">Damaged</option><option value="MISSING">Missing</option><option value="WRONG_ITEM">Wrong item</option>
      </select>
      <input className={inputCls} placeholder="Which item?" value={f.item} onChange={(e) => set("item", e.target.value)} />
      <input className={inputCls} type="number" min="1" placeholder="Pieces" value={f.qty} onChange={(e) => set("qty", e.target.value)} />
      <div>
        <input className={inputCls} type="number" min="0" placeholder="Hours after delivery" value={f.hours} onChange={(e) => set("hours", e.target.value)} />
        {late && <div className="mt-1 text-xs font-semibold text-red-600">Over 48 hours: outside the claim window.</div>}
      </div>
      <input className={inputCls} type="number" min="0" placeholder="Photos received" value={f.photos} onChange={(e) => set("photos", e.target.value)} />
      <input className={inputCls + " sm:col-span-2 lg:col-span-3"} placeholder="What happened?" value={f.note} onChange={(e) => set("note", e.target.value)} />
      <div className="sm:col-span-2 lg:col-span-3">
        <Button disabled={pending} onClick={() => run(() => raiseClaim({ orderId: f.orderId, kind: f.kind, item: f.item, qty: Number(f.qty), note: f.note, hoursAfterDelivery: Number(f.hours) || 0, photos: Number(f.photos) || 0 }), () => setF(empty))}>Raise claim</Button>
      </div>
    </div>
  );
}

export function ClaimActions({ id, status, outcome }: { id: string; status: string; outcome: string | null }) {
  const { run, pending } = useRun();
  const [mode, setMode] = useState<"" | "credit" | "reject">("");
  const [amount, setAmount] = useState("");
  const [text, setText] = useState("");
  if (status === "OPEN") {
    if (mode === "credit")
      return (
        <div className="flex gap-2">
          <input className={inputCls + " w-28"} type="number" placeholder="Rs amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Button className="!py-1.5" disabled={pending} onClick={() => run(() => decideClaim(id, { approve: true, outcome: "CREDIT_NOTE", amount: Number(amount), note: "" }))}>Approve</Button>
        </div>
      );
    if (mode === "reject")
      return (
        <div className="flex gap-2">
          <input className={inputCls} placeholder="Reason" value={text} onChange={(e) => setText(e.target.value)} />
          <Button variant="ghost" className="!py-1.5" disabled={pending} onClick={() => run(() => decideClaim(id, { approve: false, outcome: "CREDIT_NOTE", amount: 0, note: text }))}>Reject</Button>
        </div>
      );
    return (
      <div className="flex flex-wrap gap-2">
        <Button className="!py-1.5" onClick={() => setMode("credit")}>Credit note</Button>
        <Button variant="ghost" className="!py-1.5" disabled={pending} onClick={() => run(() => decideClaim(id, { approve: true, outcome: "REPLACEMENT", amount: 0, note: "" }))}>Replace</Button>
        <Button variant="ghost" className="!py-1.5" onClick={() => setMode("reject")}>Reject</Button>
      </div>
    );
  }
  if (status === "APPROVED")
    return (
      <div className="flex gap-2">
        {outcome === "CREDIT_NOTE" && <input className={inputCls + " w-36"} placeholder="Credit note no." value={text} onChange={(e) => setText(e.target.value)} />}
        <Button className="!py-1.5" disabled={pending} onClick={() => run(() => closeClaim(id, text))}>{outcome === "CREDIT_NOTE" ? "Credit note issued" : "Replacement sent"}</Button>
      </div>
    );
  return null;
}
