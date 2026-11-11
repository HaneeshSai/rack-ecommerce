"use client";

import { useState } from "react";
import { Badge, Button, Card, inputCls } from "@/components/ui";
import { inr } from "@/lib/money";

export type AccountView = {
  businessName: string; gstin: string; gstVerified: boolean; contactName: string; phone: string; email: string;
  city: string; address: string; status: string; tier: string; homeWarehouse: string; termsDays: number;
  creditLimit: number; creditUsed: number; rep: string; addresses: string[];
  users: { name: string; email: string; role: string }[];
};

export function AccountClient({ a }: { a: AccountView }) {
  const [addresses, setAddresses] = useState(a.addresses);
  const [newAddr, setNewAddr] = useState("");
  const [users, setUsers] = useState(a.users);
  const [inv, setInv] = useState({ name: "", email: "" });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-3 p-5 text-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Business details</h2>
          <Badge tone={a.status === "APPROVED" ? "green" : a.status === "PENDING" ? "amber" : "red"}>{a.status.toLowerCase()}</Badge>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          {[
            ["Business name", a.businessName], ["Contact person", a.contactName], ["Mobile", a.phone], ["Email", a.email],
            ["City", a.city], ["Registered address", a.address],
          ].map(([k, v]) => (
            <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
          ))}
          <div className="col-span-2">
            <dt className="text-xs text-muted">GSTIN</dt>
            <dd className="flex items-center gap-2 font-medium">
              {a.gstin} <Badge tone={a.gstVerified ? "green" : "amber"}>{a.gstVerified ? "Verified on GST portal" : "Verification pending"}</Badge>
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="space-y-3 p-5 text-sm">
        <h2 className="font-bold">Credit & terms</h2>
        <dl className="grid grid-cols-2 gap-3">
          {[
            ["Price tier", a.tier], ["Home warehouse", a.homeWarehouse], ["Payment terms", `${a.termsDays} days`],
            ["Account manager", a.rep], ["Credit limit", inr(a.creditLimit)], ["Outstanding", inr(a.creditUsed)],
          ].map(([k, v]) => (
            <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
          ))}
        </dl>
        <p className="text-xs text-muted">To change your limit or terms, contact your account manager.</p>
      </Card>

      <Card className="space-y-3 p-5 text-sm">
        <h2 className="font-bold">Delivery addresses</h2>
        <ul className="divide-y divide-line">
          {addresses.map((ad, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2">
              <span>{ad}{i === 0 && <Badge tone="gray"> default</Badge>}</span>
              <button className="text-xs text-red-600 hover:underline" onClick={() => setAddresses((l) => l.filter((_, j) => j !== i))}>Remove</button>
            </li>
          ))}
          {addresses.length === 0 && <li className="py-2 text-muted">No saved addresses.</li>}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); if (newAddr.trim()) { setAddresses((l) => [...l, newAddr.trim()]); setNewAddr(""); } }}
        >
          <input className={inputCls} placeholder="Add a delivery address" value={newAddr} onChange={(e) => setNewAddr(e.target.value)} />
          <Button type="submit" variant="ghost">Add</Button>
        </form>
      </Card>

      <Card className="space-y-3 p-5 text-sm">
        <h2 className="font-bold">Users on this account</h2>
        <ul className="divide-y divide-line">
          {users.map((u, i) => (
            <li key={u.email} className="flex items-center justify-between gap-3 py-2">
              <span><b>{u.name}</b><span className="block text-xs text-muted">{u.email}</span></span>
              <span className="flex items-center gap-3">
                <Badge tone={u.role === "Owner" ? "blue" : "gray"}>{u.role}</Badge>
                {u.role !== "Owner" && <button className="text-xs text-red-600 hover:underline" onClick={() => setUsers((l) => l.filter((_, j) => j !== i))}>Remove</button>}
              </span>
            </li>
          ))}
        </ul>
        <form
          className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (inv.name.trim() && inv.email.trim()) { setUsers((l) => [...l, { ...inv, role: "Invited" }]); setInv({ name: "", email: "" }); }
          }}
        >
          <input className={inputCls} placeholder="Name" value={inv.name} onChange={(e) => setInv({ ...inv, name: e.target.value })} />
          <input className={inputCls} type="email" placeholder="Email" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} />
          <Button type="submit" variant="ghost">Invite</Button>
        </form>
      </Card>
    </div>
  );
}
