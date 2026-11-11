"use client";

// Frontend-only checkout demo. Freight, GST split, warehouse routing and payment
// routes are all computed in the browser from the data passed by the server page.
import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Button, Card, LinkButton, PageTitle, inputCls } from "@/components/ui";
import { useCart } from "@/components/cart";
import { useViewer } from "@/components/store/viewer";
import type { PriceInfo } from "@/components/store/price-map";
import { gstBreakup, gstBreakupInclusive, type GstBreakup } from "@/lib/gst";
import { DEFAULT_CITIES, DEFAULT_FREIGHT, SHIPPING_CLASS_LABEL, WAREHOUSES, type ShippingClass } from "@/lib/logistics";
import { inr, inr2 } from "@/lib/money";

export type DealerInfo = {
  name: string; contact: string; phone: string; gstin: string; city: string; home: string;
  creditLimit: number; creditUsed: number; termsDays: number; overdue: number;
};

type Delivery = "FREIGHT" | "PICKUP" | "SELF";
type Method = "ONLINE" | "BANK" | "CREDIT";

const sum = (a: GstBreakup, b: GstBreakup): GstBreakup => ({
  subtotal: a.subtotal + b.subtotal, cgst: a.cgst + b.cgst, sgst: a.sgst + b.sgst, igst: a.igst + b.igst,
  gstTotal: a.gstTotal + b.gstTotal, total: a.total + b.total, intraState: a.intraState,
});

export function CheckoutView({
  priceMap, dealer, bank, holdDays,
}: {
  priceMap: Record<string, PriceInfo>; dealer: DealerInfo; bank: string; holdDays: number;
}) {
  const { items, clear } = useCart();
  const viewer = useViewer();
  const isDealer = viewer.isDealer;

  const [city, setCity] = useState(dealer.city);
  const [delivery, setDelivery] = useState<Delivery>("FREIGHT");
  const [method, setMethod] = useState<Method>("ONLINE");
  const [override, setOverride] = useState(false);
  const [placed, setPlaced] = useState<{ number: string; method: Method; delivery: Delivery; total: number; hub: string } | null>(null);

  const cityRule = DEFAULT_CITIES.find((c) => c.city === city)!;

  const calc = useMemo(() => {
    const lines = items
      .filter((i) => priceMap[i.variantId])
      .map((i) => {
        const p = priceMap[i.variantId];
        return { i, p, unit: viewer.unit(p.retail, p.dealer) };
      });

    // Routing: dealers use their home warehouse first, then nearest with full stock.
    const prefs = isDealer ? [dealer.home, ...cityRule.near.filter((c) => c !== dealer.home)] : cityRule.near;
    const full = prefs.find((code) => lines.every((l) => (l.p.stock[code] ?? 0) >= l.i.qty));
    const hubCode = full ?? prefs[0];
    const split = !full;
    const hub = WAREHOUSES.find((w) => w.code === hubCode)!;

    const cls: ShippingClass = lines.some((l) => l.p.shipping === "TATA_ACE") ? "TATA_ACE" : "THREE_WHEELER";
    const band = hub.city === city ? "local" : hub.state === cityRule.state ? "state" : "inter";
    const vehicles = split ? 2 : 1;
    const freight = delivery === "FREIGHT" ? DEFAULT_FREIGHT[cls][band] * vehicles : 0;

    const itemLines = lines.map((l) => ({ amount: l.unit * l.i.qty, rate: l.p.gstRate }));
    const gItems = isDealer ? gstBreakup(itemLines, hub.state, cityRule.state) : gstBreakupInclusive(itemLines, hub.state, cityRule.state);
    const gFreight = gstBreakup(freight ? [{ amount: freight, rate: 18 }] : [], hub.state, cityRule.state);
    const g = sum(gItems, gFreight);
    return { lines, hub, split, cls, band, vehicles, freight, g, gItems };
  }, [items, priceMap, viewer, isDealer, dealer.home, cityRule, city, delivery]);

  const available = dealer.creditLimit - dealer.creditUsed;
  const creditBlocked = dealer.overdue > 0 && !override;
  const creditTooLow = calc.g.total > available;

  const methods: { key: Method; title: string; sub: string; disabled?: boolean }[] = isDealer
    ? [
        { key: "ONLINE", title: "Online payment", sub: "UPI, cards, net banking (Razorpay / Cashfree)" },
        { key: "BANK", title: "Bank transfer (NEFT / RTGS)", sub: `Against proforma invoice. Stock held ${holdDays} days.` },
        {
          key: "CREDIT",
          title: "Credit (pay later)",
          sub: creditBlocked
            ? `Blocked: overdue invoices of ${inr(dealer.overdue)}.`
            : creditTooLow
              ? `Over your available credit (${inr(Math.max(0, available))}).`
              : `Available ${inr(available)}. Due in ${dealer.termsDays} days.`,
          disabled: creditBlocked || creditTooLow,
        },
      ]
    : [{ key: "ONLINE", title: "Online payment", sub: "UPI, cards and net banking (Razorpay / Cashfree)" }];

  if (placed) return <Confirmation placed={placed} bank={bank} holdDays={holdDays} termsDays={dealer.termsDays} onDone={() => undefined} />;
  if (items.length === 0) return <p className="py-20 text-center text-muted">Your cart is empty.</p>;

  const place = (e: React.FormEvent) => {
    e.preventDefault();
    const number = `RK-${10100 + Math.floor(Math.random() * 800)}`;
    setPlaced({ number, method: isDealer ? method : "ONLINE", delivery, total: calc.g.total, hub: calc.hub.city });
    clear();
  };

  const deliveryOpts: { key: Delivery; title: string; sub: string }[] = isDealer
    ? [
        { key: "FREIGHT", title: "Prepaid freight", sub: "Freight added to the tax invoice. We book the vehicle." },
        { key: "SELF", title: "Self-booked freight", sub: "Rs 0 freight. You book your own Porter or pay the driver." },
      ]
    : [
        { key: "FREIGHT", title: "Delivery by vehicle", sub: "Racks ship assembled. Freight priced by vehicle size." },
        { key: "PICKUP", title: "Store pickup", sub: `Collect from the ${calc.hub.city} warehouse. No freight.` },
      ];

  return (
    <>
      <PageTitle title="Checkout" sub={isDealer ? `Ordering as ${dealer.name} (Gold tier, trade prices ex-GST)` : "Prices include GST"} />
      <form onSubmit={place} className="grid gap-6 md:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Card className="space-y-4 p-5">
            <h2 className="font-bold">Your details</h2>
            <label className="block text-sm font-medium">{isDealer ? "Business name" : "Full name"}
              <input name="name" required defaultValue={isDealer ? dealer.name : ""} key={`n${isDealer}`} className={inputCls + " mt-1"} />
            </label>
            <label className="block text-sm font-medium">Mobile (WhatsApp updates)
              <input name="phone" required inputMode="numeric" maxLength={10} defaultValue={isDealer ? dealer.phone : ""} key={`p${isDealer}`} className={inputCls + " mt-1"} />
            </label>
            <label className="block text-sm font-medium">GSTIN {!isDealer && <span className="font-normal text-muted">(optional, for ITC)</span>}
              <input name="gstin" maxLength={15} required={isDealer} defaultValue={isDealer ? dealer.gstin : ""} key={`g${isDealer}`} className={inputCls + " mt-1 uppercase"} />
            </label>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="font-bold">Delivery</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">City
                <select value={city} onChange={(e) => setCity(e.target.value)} className={inputCls + " mt-1"}>
                  {DEFAULT_CITIES.map((c) => <option key={c.city}>{c.city}</option>)}
                </select>
              </label>
              <div className="text-sm font-medium">State
                <div className="mt-1 rounded-lg border border-line bg-slate-50 px-3 py-2 text-sm">{cityRule.state}</div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {deliveryOpts.map((o) => (
                <Choice key={o.key} active={delivery === o.key} onClick={() => setDelivery(o.key)} title={o.title} sub={o.sub} />
              ))}
            </div>
            <div className="rounded-lg bg-accent-soft p-3 text-sm">
              <b>Routed to the {calc.hub.city} hub</b>
              {calc.split
                ? ` - no single warehouse has every item, so this order would be split across hubs (${calc.vehicles} vehicles).`
                : isDealer && calc.hub.code === dealer.home
                  ? " - your home warehouse has every item."
                  : " - nearest warehouse with every item in stock."}
              {delivery === "FREIGHT" && (
                <span className="block text-muted">
                  Vehicle: {SHIPPING_CLASS_LABEL[calc.cls]} &middot; {calc.band === "local" ? "same city" : calc.band === "state" ? "within state" : "other state"} rate
                </span>
              )}
            </div>
          </Card>

          <Card className="space-y-3 p-5">
            <h2 className="font-bold">Payment</h2>
            {methods.map((m) => (
              <Choice
                key={m.key}
                active={method === m.key || (!isDealer && m.key === "ONLINE")}
                disabled={m.disabled}
                onClick={() => setMethod(m.key)}
                title={m.title}
                sub={m.sub}
              />
            ))}
            {isDealer && creditBlocked && (
              <button type="button" onClick={() => setOverride(true)} className="text-xs font-semibold text-accent hover:underline">
                Request manager override (demo)
              </button>
            )}
            {isDealer && override && dealer.overdue > 0 && (
              <p className="text-xs text-emerald-700">Manager override granted (demo). Credit route unlocked.</p>
            )}
            {!isDealer && <p className="text-xs text-muted">Bank transfer and credit are available to approved dealers. <Link href="/dealer-registration" className="font-semibold text-accent hover:underline">Apply now</Link>.</p>}
          </Card>
        </div>

        <Card className="h-fit space-y-2 p-5 text-sm md:sticky md:top-28">
          {calc.lines.map(({ i, unit }) => (
            <div key={i.variantId} className="flex justify-between gap-3">
              <span>{i.name} <span className="text-muted">({i.label}) x {i.qty}</span></span>
              <span>{inr(unit * i.qty)}</span>
            </div>
          ))}
          <hr className="border-line" />
          <Row k={isDealer ? "Subtotal (ex-GST)" : "Taxable value"} v={inr2(calc.gItems.subtotal)} />
          {calc.freight > 0 && <Row k={`Freight (${SHIPPING_CLASS_LABEL[calc.cls]}${calc.vehicles > 1 ? ` x${calc.vehicles}` : ""})`} v={inr2(calc.freight)} />}
          {calc.g.intraState ? (
            <>
              <Row k="CGST" v={inr2(calc.g.cgst)} />
              <Row k="SGST" v={inr2(calc.g.sgst)} />
            </>
          ) : (
            <Row k="IGST" v={inr2(calc.g.igst)} />
          )}
          <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
            <span>Total</span><span>{inr2(calc.g.total)}</span>
          </div>
          <p className="text-xs text-muted">
            Seller state {calc.hub.state} &rarr; delivery state {cityRule.state}: {calc.g.intraState ? "CGST + SGST" : "IGST"}.
          </p>
          <Button type="submit" className="mt-2 w-full">
            {isDealer && method === "BANK" ? "Place order and get proforma" : isDealer && method === "CREDIT" ? "Place order on credit" : "Pay (mock) and place order"}
          </Button>
          <p className="text-xs text-muted">Prototype: no real payment is taken.</p>
        </Card>
      </form>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><span className="text-muted">{k}</span><span>{v}</span></div>;
}

function Choice({ active, onClick, title, sub, disabled }: { active: boolean; onClick: () => void; title: string; sub: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition",
        active ? "border-accent bg-accent-soft" : "border-line bg-white hover:border-accent/60",
        disabled && "cursor-not-allowed opacity-50 hover:border-line",
      )}
    >
      <span className={clsx("mt-0.5 h-4 w-4 shrink-0 rounded-full border-2", active ? "border-accent bg-accent" : "border-slate-300")} />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-xs text-muted">{sub}</span>
      </span>
    </button>
  );
}

const STEPS = ["Placed", "Confirmed", "Packed", "Dispatched", "Delivered"];

function Confirmation({
  placed, bank, holdDays, termsDays,
}: {
  placed: { number: string; method: Method; delivery: Delivery; total: number; hub: string };
  bank: string; holdDays: number; termsDays: number; onDone: () => void;
}) {
  const pendingPay = placed.method === "BANK";
  const active = pendingPay ? 0 : 1;
  return (
    <div className="mx-auto max-w-2xl space-y-5 text-center">
      <div className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
        {pendingPay ? "Order placed - payment pending" : "Order confirmed"}
      </div>
      <h1 className="text-3xl font-extrabold">Thank you!</h1>
      <p className="text-muted">Order <b className="text-foreground">{placed.number}</b> &middot; {inr2(placed.total)} &middot; dispatching from {placed.hub}</p>

      <Card className="p-5 text-left">
        <ol className="flex items-center justify-between text-xs">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 flex-col items-center gap-1">
              <span className={clsx("flex h-7 w-7 items-center justify-center rounded-full font-bold", i <= active ? "bg-accent text-white" : "bg-slate-100 text-slate-400")}>{i + 1}</span>
              <span className={i <= active ? "font-semibold" : "text-muted"}>{s}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="space-y-2 p-5 text-left text-sm">
        {placed.method === "ONLINE" && <p>Payment received (mock). A GST tax invoice has been emailed and a WhatsApp confirmation sent.</p>}
        {placed.method === "BANK" && (
          <>
            <p>
              We have reserved your stock for <b>{holdDays} days</b> and emailed proforma invoice <b>PF/{placed.number}</b>.
              Pay by NEFT / RTGS, then upload the UTR in your dealer portal.
            </p>
            <p className="rounded-lg bg-slate-50 p-3 text-xs text-muted">{bank}</p>
          </>
        )}
        {placed.method === "CREDIT" && <p>Order confirmed on credit. The amount is added to your outstanding balance and is due in <b>{termsDays} days</b>.</p>}
        <p className="text-muted">
          {placed.delivery === "PICKUP" ? "Collect from the warehouse once we message you." : placed.delivery === "SELF" ? "Book your own vehicle; we will message you when the order is packed." : "Dispatch details (vehicle, driver, booking ID) will be sent by email and WhatsApp."}
        </p>
      </Card>

      <div className="flex flex-wrap justify-center gap-3">
        <LinkButton href="/">Back to store</LinkButton>
        <LinkButton href="/order/RK-10002" variant="ghost">See a sample order tracker</LinkButton>
      </div>
    </div>
  );
}
