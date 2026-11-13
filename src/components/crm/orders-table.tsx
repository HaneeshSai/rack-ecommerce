"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Card, inputCls } from "@/components/ui";
import { inr } from "@/lib/money";
import { StageBadge, ageText } from "./bits";
import clsx from "clsx";
import type { CrmDTO } from "@/lib/crm-data";

export type Row = Pick<CrmDTO, "id" | "number" | "dealerName" | "dealerCity" | "fieldRep" | "terms" | "hub" | "total" | "stage" | "overdueDays" | "createdAt" | "urgency" | "stageDays" | "dealerId"> & { next: string };

export function OrdersTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase();
  const list = s ? rows.filter((o) => `${o.number} ${o.dealerName} ${o.dealerCity} ${o.fieldRep}`.toLowerCase().includes(s)) : rows;

  return (
    <>
      <input className={inputCls + " mb-3 max-w-sm"} placeholder="Search order, dealer or sales person" value={q} onChange={(e) => setQ(e.target.value)} />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase text-muted">
              <th className="p-3">Order</th><th className="p-3">Dealer</th><th className="p-3">Next action</th><th className="p-3">Stage</th>
              <th className="p-3 text-right">Total</th><th className="p-3">Hub</th><th className="p-3">Entered</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id} onClick={() => router.push(`/orders/${o.id}`)} className={clsx("cursor-pointer border-b border-line last:border-0 hover:bg-slate-50", o.urgency === "late" && "bg-red-50/60", o.urgency === "warn" && "bg-amber-50/60")}>
                <td className="p-3 font-semibold text-accent"><Link href={`/orders/${o.id}`}>{o.number}</Link></td>
                <td className="p-3"><Link href={`/dealers/${o.dealerId}`} onClick={(e) => e.stopPropagation()} className="hover:text-accent">{o.dealerName}</Link><div className="text-xs text-muted">{o.fieldRep}</div></td>
                <td className="p-3 font-medium">{o.next}{o.urgency === "late" || o.urgency === "warn" ? <div className={clsx("text-xs font-semibold", o.urgency === "late" ? "text-red-600" : "text-amber-600")}>{o.overdueDays > 0 ? "Payment overdue" : `Waiting ${o.stageDays} days`}</div> : null}</td>
                <td className="p-3"><StageBadge stage={o.stage} />{o.overdueDays > 0 && <> <Badge tone="red">{o.overdueDays}d overdue</Badge></>}</td>
                <td className="p-3 text-right">{inr(o.total)}</td>
                <td className="p-3">{o.hub}</td>
                <td className="p-3 text-muted">{ageText(o.createdAt)}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted">No orders found.</td></tr>}
          </tbody>
        </table>
      </Card>
    </>
  );
}
