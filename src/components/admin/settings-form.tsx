"use client";

import { useState } from "react";
import { Button, Card, inputCls } from "@/components/ui";
import { SHIPPING_CLASS_LABEL, WAREHOUSES, type CityRule, type FreightTable, type ShippingClass } from "@/lib/logistics";
import { useToast } from "@/components/admin/toast";

type Initial = {
  holdDays: number; discountApprovalPct: number; splitDefault: string; lowStock: number; blockOverdueCredit: boolean;
  inactiveDays: number; invoiceSeries: string; bank: string; gstin: Record<string, string>; freight: FreightTable; cities: CityRule[];
};

const TEMPLATES = [
  ["Dealer approved", "Hi {name}, your dealer account is approved. Trade prices are now visible when you sign in."],
  ["Order confirmed", "Hi {name}, order {order} is confirmed. Tax invoice {invoice} is attached."],
  ["Order dispatched", "Your order {order} is on its way. Vehicle {vehicle}, driver {driver}."],
  ["Payment reminder", "Hi {name}, invoice {invoice} of {amount} is due on {date}."],
  ["Quote sent", "Quote {quote} is ready. Open the dealer portal to review and accept."],
];

export function SettingsForm({ initial }: { initial: Initial }) {
  const toast = useToast();
  const [s, setS] = useState(initial);
  const [templates, setTemplates] = useState(TEMPLATES);
  const save = () => toast("Settings saved (demo only: nothing is stored).");
  const set = <K extends keyof Initial>(k: K, v: Initial[K]) => setS({ ...s, [k]: v });
  const classes = Object.keys(s.freight) as ShippingClass[];

  const section = (title: string, sub: string, body: React.ReactNode) => (
    <Card className="space-y-3 p-5 text-sm">
      <div><h2 className="font-bold">{title}</h2><p className="text-xs text-muted">{sub}</p></div>
      {body}
    </Card>
  );
  const num = (label: string, k: "holdDays" | "discountApprovalPct" | "lowStock" | "inactiveDays", unit = "") => (
    <label className="font-medium">{label}
      <div className="mt-1 flex items-center gap-2">
        <input type="number" min={0} value={s[k]} onChange={(e) => set(k, Number(e.target.value) || 0)} className={inputCls} />
        {unit && <span className="text-muted">{unit}</span>}
      </div>
    </label>
  );

  return (
    <div className="space-y-6">
      {section("Payment, credit and stock rules", "Bank-transfer hold, discount approval and credit controls.", (
        <div className="grid gap-4 sm:grid-cols-4">
          {num("Bank-transfer hold", "holdDays", "days")}
          {num("Discount needing approval", "discountApprovalPct", "%")}
          {num("Low-stock threshold", "lowStock", "units")}
          {num("Dealer inactive after", "inactiveDays", "days")}
          <label className="flex items-center gap-2 font-medium sm:col-span-2">
            <input type="checkbox" checked={s.blockOverdueCredit} onChange={(e) => set("blockOverdueCredit", e.target.checked)} />
            Block credit orders for dealers with overdue invoices
          </label>
          <label className="font-medium sm:col-span-2">If the nearest hub is short
            <select value={s.splitDefault} onChange={(e) => set("splitDefault", e.target.value)} className={inputCls + " mt-1"}>
              <option value="SPLIT">Split the order across hubs</option><option value="HOLD">Hold for a stock transfer</option>
            </select>
          </label>
        </div>
      ))}

      {section("Freight rate table", "Rupees per shipping class and distance band from the dispatching hub. Racks ship assembled, so freight is by vehicle.", (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line text-left text-xs uppercase text-muted">
              <tr><th className="py-2">Class</th><th className="py-2">Same city</th><th className="py-2">Same state</th><th className="py-2">Other state</th></tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c}>
                  <td className="py-2 font-medium">{SHIPPING_CLASS_LABEL[c]}</td>
                  {(["local", "state", "inter"] as const).map((b) => (
                    <td key={b} className="py-2 pr-3">
                      <input type="number" min={0} value={Math.round(s.freight[c][b] / 100)}
                        onChange={(e) => set("freight", { ...s.freight, [c]: { ...s.freight[c], [b]: (Number(e.target.value) || 0) * 100 } })}
                        className={inputCls + " !w-28"} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {section("City to warehouse map", "Nearest hub first. Orders go to the first hub that has every item.", (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line text-left text-xs uppercase text-muted"><tr><th className="py-2">City</th><th className="py-2">State</th><th className="py-2">Hubs in order</th><th /></tr></thead>
            <tbody>
              {s.cities.map((c, i) => (
                <tr key={i}>
                  {(["city", "state"] as const).map((k) => (
                    <td key={k} className="py-1 pr-2"><input value={c[k]} onChange={(e) => set("cities", s.cities.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))} className={inputCls} /></td>
                  ))}
                  <td className="py-1 pr-2">
                    <input value={c.near.join(", ")} onChange={(e) => set("cities", s.cities.map((x, j) => (j === i ? { ...x, near: e.target.value.split(",").map((v) => v.trim().toUpperCase()).filter(Boolean) } : x)))} className={inputCls + " !w-40"} />
                  </td>
                  <td className="py-1"><button onClick={() => set("cities", s.cities.filter((_, j) => j !== i))} className="px-2 text-muted hover:text-red-600" aria-label="Remove city">x</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button variant="ghost" className="mt-3" onClick={() => set("cities", [...s.cities, { city: "", state: "", near: WAREHOUSES.map((w) => w.code) }])}>Add city</Button>
        </div>
      ))}

      {section("Invoicing and tax", "Continuous invoice series per GSTIN and financial year. Tax type follows the dispatching hub's state.", (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="font-medium">Invoice series prefix
            <input value={s.invoiceSeries} onChange={(e) => set("invoiceSeries", e.target.value)} className={inputCls + " mt-1"} />
          </label>
          {Object.entries(s.gstin).map(([state, g]) => (
            <label key={state} className="font-medium">GSTIN - {state}
              <input value={g} onChange={(e) => set("gstin", { ...s.gstin, [state]: e.target.value.toUpperCase() })} className={inputCls + " mt-1"} />
            </label>
          ))}
          <label className="font-medium sm:col-span-2">Bank details on proforma invoices
            <input value={s.bank} onChange={(e) => set("bank", e.target.value)} className={inputCls + " mt-1"} />
          </label>
        </div>
      ))}

      {section("Message templates", "Used for email and WhatsApp notifications. {placeholders} are filled in per message.", (
        <div className="space-y-3">
          {templates.map(([k, v], i) => (
            <label key={k} className="block font-medium">{k}
              <textarea rows={2} value={v} onChange={(e) => setTemplates((t) => t.map((x, j) => (j === i ? [x[0], e.target.value] : x)))} className={inputCls + " mt-1"} />
            </label>
          ))}
        </div>
      ))}

      <Button onClick={save}>Save settings</Button>
    </div>
  );
}
