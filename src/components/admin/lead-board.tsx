"use client";

import { useState } from "react";
import clsx from "clsx";
import { Badge, Button, Card, inputCls } from "@/components/ui";
import { fmtDate } from "@/components/admin/format";
import { useToast } from "@/components/admin/toast";

type Lead = {
  id: string; name: string; company: string | null; phone: string; city: string; interest: string;
  status: string; source: string; assignedTo: string; lostReason: string | null; createdAt: string;
};

const STAGES: [string, string][] = [
  ["NEW", "New"], ["CONTACTED", "Contacted"], ["QUOTE_SENT", "Quote sent"],
  ["NEGOTIATION", "Negotiation"], ["WON", "Won"], ["LOST", "Lost"],
];
const SOURCES = ["website", "phone", "whatsapp", "walk-in", "indiamart", "request-quote", "dealer-registration", "referral"];
const LOST_REASONS = ["Price too high", "Went with a competitor", "No response", "Needs custom size", "Project cancelled"];
const STAGE_TONE: Record<string, string> = {
  NEW: "border-t-slate-400", CONTACTED: "border-t-blue-400", QUOTE_SENT: "border-t-amber-400",
  NEGOTIATION: "border-t-orange-500", WON: "border-t-emerald-500", LOST: "border-t-red-400",
};

export function LeadBoard({ initial, reps }: { initial: Lead[]; reps: string[] }) {
  const toast = useToast();
  const [leads, setLeads] = useState(initial);
  const [source, setSource] = useState("");
  const [rep, setRep] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [lostFor, setLostFor] = useState<string | null>(null);
  const [reason, setReason] = useState(LOST_REASONS[0]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", phone: "", city: "", interest: "", source: "phone", assignedTo: reps[0] ?? "" });

  const move = (id: string, to: string) => {
    if (to === "LOST") {
      setLostFor(id);
      return;
    }
    setLeads((c) => c.map((l) => (l.id === id ? { ...l, status: to, lostReason: null } : l)));
    if (to === "WON") toast("Lead marked Won. Convert to a dealer account or order from the account page.");
  };
  const confirmLost = () => {
    if (!lostFor) return;
    setLeads((c) => c.map((l) => (l.id === lostFor ? { ...l, status: "LOST", lostReason: reason } : l)));
    setLostFor(null);
    toast("Lead marked Lost with reason.");
  };
  const step = (l: Lead, dir: 1 | -1) => {
    const i = STAGES.findIndex(([k]) => k === l.status) + dir;
    if (i >= 0 && i < STAGES.length) move(l.id, STAGES[i][0]);
  };
  const addLead = () => {
    if (!form.name || !form.phone) {
      toast("Name and phone are required.");
      return;
    }
    setLeads((c) => [{ id: `new-${Date.now()}`, ...form, company: form.company || null, status: "NEW", lostReason: null, createdAt: new Date().toISOString() }, ...c]);
    setForm({ ...form, name: "", company: "", phone: "", interest: "" });
    setAdding(false);
    toast("Lead added to New.");
  };

  const shown = leads.filter((l) => (!source || l.source === source) && (!rep || l.assignedTo === rep));
  const allSources = [...new Set([...SOURCES, ...leads.map((l) => l.source)])];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={source} onChange={(e) => setSource(e.target.value)} className={inputCls + " !w-auto"}>
          <option value="">All sources</option>
          {allSources.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={rep} onChange={(e) => setRep(e.target.value)} className={inputCls + " !w-auto"}>
          <option value="">All reps</option>
          {reps.map((r) => <option key={r}>{r}</option>)}
        </select>
        <span className="text-sm text-muted">{shown.length} leads</span>
        <Button className="ml-auto" onClick={() => setAdding((a) => !a)}>{adding ? "Close" : "Add lead"}</Button>
      </div>

      {adding && (
        <Card className="mb-4 grid gap-3 p-4 text-sm sm:grid-cols-3">
          {(["name", "company", "phone", "city", "interest"] as const).map((k) => (
            <label key={k} className={clsx("font-medium capitalize", k === "interest" && "sm:col-span-2")}>
              {k}
              <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={inputCls + " mt-1"} />
            </label>
          ))}
          <label className="font-medium">Source
            <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={inputCls + " mt-1"}>
              {["phone", "whatsapp", "walk-in", "indiamart", "website"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="font-medium">Assign to
            <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className={inputCls + " mt-1"}>
              {reps.map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
          <div className="flex items-end"><Button onClick={addLead}>Save lead</Button></div>
        </Card>
      )}

      {lostFor && (
        <Card className="mb-4 flex flex-wrap items-center gap-3 border-red-200 bg-red-50 p-4 text-sm">
          <b>Why was this lead lost?</b>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls + " !w-auto"}>
            {LOST_REASONS.map((r) => <option key={r}>{r}</option>)}
          </select>
          <Button onClick={confirmLost}>Mark lost</Button>
          <Button variant="ghost" onClick={() => setLostFor(null)}>Cancel</Button>
        </Card>
      )}

      <div className="grid gap-3 overflow-x-auto pb-4 [grid-auto-columns:minmax(230px,1fr)] [grid-auto-flow:column]">
        {STAGES.map(([key, label]) => {
          const col = shown.filter((l) => l.status === key);
          return (
            <div
              key={key}
              onDragOver={(e) => { e.preventDefault(); setOver(key); }}
              onDragLeave={() => setOver((o) => (o === key ? null : o))}
              onDrop={() => { if (dragId) move(dragId, key); setDragId(null); setOver(null); }}
              className={clsx("min-h-40 rounded-xl border-t-4 bg-slate-100/70 p-2 transition", STAGE_TONE[key], over === key && "ring-2 ring-accent")}
            >
              <div className="mb-2 flex items-center justify-between px-1 text-sm font-bold">
                {label} <span className="rounded-full bg-white px-2 text-xs text-muted">{col.length}</span>
              </div>
              <div className="space-y-2">
                {col.map((l) => (
                  <div
                    key={l.id}
                    draggable
                    onDragStart={() => setDragId(l.id)}
                    onDragEnd={() => { setDragId(null); setOver(null); }}
                    className="cursor-grab rounded-lg border border-line bg-white p-3 text-sm shadow-sm active:cursor-grabbing"
                  >
                    <div className="font-semibold">{l.name}{l.company ? ` - ${l.company}` : ""}</div>
                    <p className="mt-0.5 text-muted">{l.interest}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge tone="gray">{l.city}</Badge>
                      <Badge tone="blue">{l.source}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted">{l.assignedTo} - {fmtDate(l.createdAt)}</div>
                    {l.lostReason && <div className="mt-1 text-xs text-red-600">Lost: {l.lostReason}</div>}
                    <div className="mt-2 flex justify-between">
                      <button disabled={l.status === STAGES[0][0]} onClick={() => step(l, -1)} className="rounded border border-line px-2 text-xs disabled:opacity-30" aria-label="Move back">&larr;</button>
                      <button disabled={l.status === "LOST"} onClick={() => step(l, 1)} className="rounded border border-line px-2 text-xs disabled:opacity-30" aria-label="Move forward">&rarr;</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
