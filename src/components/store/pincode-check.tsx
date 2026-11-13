"use client";

import { useState } from "react";
import { Button, inputCls } from "@/components/ui";
import { estimateDelivery, type DeliveryEstimate } from "@/lib/pincode";
import type { ShippingClass } from "@/lib/logistics";
import { inr } from "@/lib/money";

const fmt = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" });
};

// Delivery date and freight estimate for one piece, by pincode.
export function PincodeCheck({ shippingClass }: { shippingClass: ShippingClass }) {
  const [pin, setPin] = useState("");
  const [res, setRes] = useState<DeliveryEstimate | null>(null);
  return (
    <div className="mt-4 rounded-xl border border-line bg-white p-4 text-sm">
      <div className="mb-2 font-semibold">Check delivery to your pincode</div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setRes(estimateDelivery(pin.trim(), shippingClass)); }}>
        <input className={inputCls} inputMode="numeric" maxLength={6} placeholder="e.g. 500081" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />
        <Button variant="dark" type="submit">Check</Button>
      </form>
      {res && !res.ok && <p className="mt-2 text-amber-700">{res.reason}</p>}
      {res?.ok && (
        <div className="mt-3 space-y-1">
          <p>Delivering to <b>{res.city}, {res.state}</b> from our <b>{res.hubCity}</b> warehouse.</p>
          <p>Expected by <b>{fmt(res.minDays)} to {fmt(res.maxDays)}</b>.</p>
          <p>Freight for one piece: <b>{inr(res.freight)}</b> + GST. <span className="text-muted">Free delivery on orders above Rs 25,000. Final freight is confirmed at checkout.</span></p>
        </div>
      )}
    </div>
  );
}
