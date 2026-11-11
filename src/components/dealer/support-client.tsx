"use client";

import { useState } from "react";
import { Badge, Button, Card, inputCls } from "@/components/ui";
import { dateStr } from "./format";

export type TicketView = {
  number: string; type: string; status: string; orderNumber: string | null; subject: string; message: string; createdAt: string;
};

const TYPES: [string, string][] = [
  ["DAMAGE", "Damage"], ["MISSING", "Missing item"], ["WRONG", "Wrong item"], ["INSTALL", "Installation help"], ["RETURN", "Return"],
];
const label = (t: string) => TYPES.find(([k]) => k === t)?.[1] ?? "Other";

export function SupportClient({ tickets, orders }: { tickets: TicketView[]; orders: string[] }) {
  const [list, setList] = useState(tickets);
  const [type, setType] = useState("DAMAGE");
  const [order, setOrder] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState(0);
  const [done, setDone] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const number = `TK-${3003 + list.length - tickets.length}`;
    setList((l) => [
      { number, type, status: "OPEN", orderNumber: order || null, subject, message, createdAt: new Date().toISOString() },
      ...l,
    ]);
    setDone(number);
    setSubject(""); setMessage(""); setOrder(""); setFiles(0);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-3">
        {list.map((t) => (
          <Card key={t.number} className="space-y-1 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <b>{t.number} <span className="font-normal text-muted">- {label(t.type)}</span></b>
              <Badge tone={t.status === "RESOLVED" ? "green" : t.status === "IN_PROGRESS" ? "blue" : "amber"}>{t.status.replace("_", " ").toLowerCase()}</Badge>
            </div>
            <div className="font-semibold">{t.subject}</div>
            <p className="text-muted">{t.message}</p>
            <p className="text-xs text-muted">{t.orderNumber ? `Order ${t.orderNumber} - ` : ""}Raised {dateStr(t.createdAt)}</p>
          </Card>
        ))}
        {list.length === 0 && <p className="text-muted">No support tickets yet.</p>}
      </div>

      <Card className="h-fit p-5">
        <h2 className="mb-3 font-bold">Raise a ticket</h2>
        {done && <p className="mb-3 rounded-lg bg-emerald-50 p-2 text-sm font-semibold text-emerald-800">Ticket {done} created (demo).</p>}
        <form onSubmit={submit} className="space-y-3 text-sm">
          <label className="block font-medium">Type
            <select className={inputCls + " mt-1"} value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <label className="block font-medium">Related order <span className="font-normal text-muted">(optional)</span>
            <select className={inputCls + " mt-1"} value={order} onChange={(e) => setOrder(e.target.value)}>
              <option value="">None</option>
              {orders.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label className="block font-medium">Subject
            <input required className={inputCls + " mt-1"} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>
          <label className="block font-medium">Details
            <textarea required rows={4} className={inputCls + " mt-1"} value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
          <label className="block font-medium">Photos {["DAMAGE", "MISSING", "WRONG", "RETURN"].includes(type) && <span className="font-normal text-muted">(needed for damage and returns)</span>}
            <input type="file" accept="image/*" multiple className="mt-1 block w-full text-xs" onChange={(e) => setFiles(e.target.files?.length ?? 0)} />
            {files > 0 && <span className="text-xs text-muted">{files} file(s) selected (not uploaded in the demo)</span>}
          </label>
          <Button type="submit" className="w-full">Submit ticket</Button>
        </form>
      </Card>
    </div>
  );
}
