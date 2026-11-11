"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, PageTitle, StatCard, inputCls } from "@/components/ui";
import { inr } from "@/lib/money";
import { fmtDate } from "@/components/admin/format";
import { useToast } from "@/components/admin/toast";
import type { DealerDTO } from "@/components/admin/data";

export type TimelineItem = { at: string; kind: string; text: string; href: string | null };
type Stats = {
  spend: number; orderCount: number; lastOrder: string | null; outstanding: number; overdue: number;
  buckets: number[]; inactive: boolean;
};

export function DealerAccount({
  dealer, stats, timeline, warehouses, role, blockOverdue,
}: {
  dealer: DealerDTO; stats: Stats; timeline: TimelineItem[]; warehouses: { code: string; city: string }[];
  role: string; blockOverdue: boolean;
}) {
  const toast = useToast();
  const canApprove = role === "ADMIN" || role === "SALES";
  const [status, setStatus] = useState(dealer.status);
  const [tier, setTier] = useState(dealer.tier);
  const [wh, setWh] = useState(dealer.homeWarehouse);
  const [credit, setCredit] = useState(String(Math.round(dealer.creditLimit / 100)));
  const [terms, setTerms] = useState(String(dealer.termsDays));
  const [override, setOverride] = useState(false);

  const limit = Number(credit || 0) * 100;
  const used = dealer.creditUsed;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : used > 0 ? 100 : 0;
  const blocked = status === "APPROVED" && !override && ((blockOverdue && stats.overdue > 0) || (limit > 0 && used > limit) || limit === 0);
  const labels = ["0-30 days", "31-60 days", "61-90 days", "90+ days"];

  const approve = () => {
    setStatus("APPROVED");
    toast(`Approved ${dealer.businessName} (${tier.toLowerCase()}, ${wh}, credit ${inr(limit)}). Email + WhatsApp sent to dealer.`);
  };
  const reject = () => {
    setStatus("REJECTED");
    toast("Application rejected. Email + WhatsApp sent to dealer.");
  };

  return (
    <>
      <Link href="/dealers" className="text-sm text-muted hover:text-foreground">&larr; All dealers</Link>
      <div className="mt-2">
        <PageTitle
          title={dealer.businessName}
          sub={`GSTIN ${dealer.gstin}${dealer.gstVerified ? " (verified)" : " (not verified)"}`}
          action={<Badge tone={status === "APPROVED" ? "green" : status === "PENDING" ? "amber" : "red"}>{status.toLowerCase()}</Badge>}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total spend" value={inr(stats.spend)} />
        <StatCard label="Orders" value={String(stats.orderCount)} />
        <StatCard label="Outstanding" value={inr(stats.outstanding)} tone={stats.overdue > 0 ? "warn" : undefined} />
        <StatCard label="Last order" value={fmtDate(stats.lastOrder)} />
      </div>
      {(stats.inactive || stats.overdue > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {stats.inactive && <Badge tone="gray">Inactive: no order in a long while</Badge>}
          {stats.overdue > 0 && <Badge tone="red">{inr(stats.overdue)} overdue</Badge>}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="space-y-2 p-5 text-sm">
          <h2 className="mb-1 font-bold">Profile</h2>
          {[
            ["Contact", dealer.contactName], ["Mobile", dealer.phone], ["Email", dealer.email], ["City", dealer.city],
            ["Address", dealer.address], ["Assigned rep", dealer.assignedRep], ["Applied", fmtDate(dealer.appliedAt)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4"><span className="text-muted">{k}</span><span className="text-right">{v}</span></div>
          ))}
          <div>
            <div className="text-muted">Delivery addresses</div>
            <ul className="mt-1 list-disc pl-5">{dealer.addresses.map((a) => <li key={a}>{a}</li>)}</ul>
          </div>
        </Card>

        <Card className="space-y-4 p-5 text-sm">
          <h2 className="font-bold">{status === "PENDING" ? "Approval" : "Terms and credit"}</h2>
          {!canApprove && <p className="rounded-lg bg-slate-50 p-3 text-muted">Only Admin or Sales can change dealer terms.</p>}
          <div className="grid grid-cols-2 gap-3">
            <label className="font-medium">Price tier
              <select disabled={!canApprove} value={tier} onChange={(e) => setTier(e.target.value as typeof tier)} className={inputCls + " mt-1"}>
                <option value="SILVER">Silver</option><option value="GOLD">Gold (3% off)</option><option value="PLATINUM">Platinum (6% off)</option>
              </select>
            </label>
            <label className="font-medium">Home warehouse
              <select disabled={!canApprove} value={wh} onChange={(e) => setWh(e.target.value)} className={inputCls + " mt-1"}>
                {warehouses.map((w) => <option key={w.code} value={w.code}>{w.city} ({w.code})</option>)}
              </select>
            </label>
            <label className="font-medium">Credit limit (Rs)
              <input disabled={!canApprove} type="number" min={0} value={credit} onChange={(e) => setCredit(e.target.value)} className={inputCls + " mt-1"} />
            </label>
            <label className="font-medium">Payment terms
              <select disabled={!canApprove} value={terms} onChange={(e) => setTerms(e.target.value)} className={inputCls + " mt-1"}>
                <option value="15">15 days</option><option value="30">30 days</option><option value="45">45 days</option>
              </select>
            </label>
          </div>
          {canApprove && status === "PENDING" && (
            <div className="flex gap-2">
              <Button onClick={approve}>Approve dealer</Button>
              <Button variant="ghost" onClick={reject}>Reject</Button>
            </div>
          )}
          {canApprove && status !== "PENDING" && (
            <div className="flex gap-2">
              <Button onClick={() => toast("Terms saved. Dealer sees the new prices on their next sign-in.")}>Save changes</Button>
              {status === "APPROVED" && <Button variant="ghost" onClick={() => { setStatus("REJECTED"); toast("Dealer suspended (demo)."); }}>Suspend</Button>}
              {status === "REJECTED" && <Button variant="ghost" onClick={approve}>Approve</Button>}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5 text-sm">
          <h2 className="mb-3 font-bold">Credit</h2>
          <div className="mb-1 flex justify-between"><span>Used {inr(used)}</span><span className="text-muted">of {inr(limit)}</span></div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${pct > 85 ? "bg-red-500" : "bg-accent"}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-4 rounded-lg border border-line p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">Credit orders: {blocked ? <span className="text-red-600">blocked</span> : <span className="text-emerald-600">allowed</span>}</div>
                <p className="text-xs text-muted">Blocked when over the limit or with overdue invoices, unless a manager overrides.</p>
              </div>
              <label className="flex shrink-0 items-center gap-2 text-xs font-semibold">
                <input type="checkbox" disabled={role !== "ADMIN"} checked={override} onChange={(e) => { setOverride(e.target.checked); toast(e.target.checked ? "Manager override ON for this dealer (logged)." : "Manager override removed."); }} />
                Manager override
              </label>
            </div>
            {role !== "ADMIN" && <p className="mt-2 text-xs text-muted">Only a manager (Admin) can override.</p>}
          </div>
        </Card>

        <Card className="p-5 text-sm">
          <h2 className="mb-3 font-bold">Outstanding ageing</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.buckets.map((b, i) => (
              <div key={labels[i]} className={`rounded-lg p-3 ${i === 3 && b > 0 ? "bg-red-50" : "bg-slate-50"}`}>
                <div className="text-xs text-muted">{labels[i]}</div>
                <div className="font-bold">{inr(b)}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Based on unpaid credit invoices, counted from invoice date.</p>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="mb-3 font-bold">Timeline</h2>
        <ul className="divide-y divide-line text-sm">
          {timeline.map((t, i) => (
            <li key={i} className="flex flex-wrap items-center gap-3 py-2">
              <Badge tone="gray">{t.kind}</Badge>
              {t.href ? <Link href={t.href} className="hover:underline">{t.text}</Link> : <span>{t.text}</span>}
              <span className="ml-auto text-xs text-muted">{fmtDate(t.at)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
