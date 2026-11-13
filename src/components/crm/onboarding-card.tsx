"use client";

import { useState } from "react";
import { Badge, Button, Card, inputCls } from "@/components/ui";
import { approveDealer, rejectDealer, updateDealerProfile, verifyGstin } from "@/lib/actions/crm";
import { fmtDate } from "@/components/admin/format";
import { useRun } from "./use-run";
import type { Tier } from "@/lib/logistics";

type Dealer = {
  id: string; businessName: string; gstin: string; gstVerified: boolean; formatOk: boolean; contactName: string; phone: string;
  email: string; city: string; address: string; tier: Tier; hub: string; creditLimit: number; termsDays: number; appliedAt: string;
};

export function OnboardingCard({ dealer: d, hubs }: { dealer: Dealer; hubs: { code: string; city: string }[] }) {
  const { run, pending } = useRun();
  const [p, setP] = useState({ contactName: d.contactName, phone: d.phone, email: d.email, address: d.address });
  const [tier, setTier] = useState<Tier>(d.tier);
  const [hub, setHub] = useState(d.hub);
  const [credit, setCredit] = useState(d.creditLimit || 50000);
  const [terms, setTerms] = useState(d.termsDays || 30);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{d.businessName}</h3>
          <p className="text-sm text-muted">{d.city} · applied {fmtDate(d.appliedAt)}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono">{d.gstin}</span>
          {d.gstVerified ? <Badge tone="green">GSTIN verified</Badge> : d.formatOk ? <Badge tone="amber">Not verified</Badge> : <Badge tone="red">Invalid format</Badge>}
          {!d.gstVerified && <Button variant="ghost" className="!py-1.5" disabled={pending} onClick={() => run(() => verifyGstin(d.id))}>Verify GSTIN</Button>}
        </div>
      </div>

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div className="space-y-2 text-sm">
          <div className="font-semibold">Profile</div>
          {(["contactName", "phone", "email", "address"] as const).map((k) => (
            <label key={k} className="block">
              <span className="text-xs text-muted">{k === "contactName" ? "Contact person" : k[0].toUpperCase() + k.slice(1)}</span>
              <input className={inputCls} value={p[k]} onChange={(e) => setP({ ...p, [k]: e.target.value })} />
            </label>
          ))}
          <Button variant="ghost" className="!py-1.5" disabled={pending} onClick={() => run(() => updateDealerProfile(d.id, p))}>Save profile</Button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="font-semibold">Approval terms</div>
          <div className="grid grid-cols-2 gap-2">
            <label><span className="text-xs text-muted">Price tier</span>
              <select className={inputCls} value={tier} onChange={(e) => setTier(e.target.value as Tier)}>
                <option value="SILVER">Silver</option><option value="GOLD">Gold (3% off)</option><option value="PLATINUM">Platinum (6% off)</option>
              </select></label>
            <label><span className="text-xs text-muted">Home hub</span>
              <select className={inputCls} value={hub} onChange={(e) => setHub(e.target.value)}>
                {hubs.map((h) => <option key={h.code} value={h.code}>{h.city}</option>)}
              </select></label>
            <label><span className="text-xs text-muted">Credit limit (Rs)</span>
              <input type="number" min={0} className={inputCls} value={credit} onChange={(e) => setCredit(Number(e.target.value))} /></label>
            <label><span className="text-xs text-muted">Payment terms (days)</span>
              <select className={inputCls} value={terms} onChange={(e) => setTerms(Number(e.target.value))}>
                <option value={0}>Advance only</option><option value={15}>15 days</option><option value={30}>30 days</option>
              </select></label>
          </div>
          {!d.gstVerified && <p className="text-xs text-amber-700">Verify the GSTIN before approving.</p>}
          <div className="flex gap-2 pt-1">
            <Button disabled={pending || !d.gstVerified} onClick={() => run(() => approveDealer(d.id, { tier, hub, creditLimit: credit, termsDays: terms }))}>Approve dealer</Button>
            <Button variant="ghost" disabled={pending} onClick={() => run(() => rejectDealer(d.id))}>Reject</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
