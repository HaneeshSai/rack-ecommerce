"use client";

// Frontend-only forms: nothing is sent anywhere, submit just shows a success state.
import { useState, type ReactNode } from "react";
import clsx from "clsx";
import { Badge, Button, Card, LinkButton, inputCls } from "@/components/ui";
import { DEFAULT_CITIES } from "@/lib/logistics";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label} {hint && <span className="font-normal text-muted">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Success({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Card className="mx-auto max-w-xl space-y-3 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-700">&#10003;</div>
      <h2 className="text-xl font-extrabold">{title}</h2>
      <div className="text-sm text-muted">{children}</div>
      {action}
    </Card>
  );
}

const cityOptions = DEFAULT_CITIES.map((c) => <option key={c.city}>{c.city}</option>);

export function QuoteForm({ products, defaultProduct }: { products: { slug: string; name: string }[]; defaultProduct?: string }) {
  const [done, setDone] = useState(false);
  if (done)
    return (
      <Success title="Quote request received" action={<LinkButton href="/" variant="ghost">Back to store</LinkButton>}>
        We&apos;ll contact you within 1 business day with pricing and availability. A lead has been created for our sales team.
      </Success>
    );
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setDone(true); }}
      className="mx-auto grid max-w-2xl gap-4 rounded-2xl border border-line bg-white p-6 shadow-[var(--shadow)] sm:grid-cols-2"
    >
      <Field label="Your name"><input required className={inputCls} /></Field>
      <Field label="Company" hint="(optional)"><input className={inputCls} /></Field>
      <Field label="Mobile"><input required inputMode="numeric" maxLength={10} pattern="[6-9][0-9]{9}" title="10-digit mobile number" className={inputCls} /></Field>
      <Field label="City"><select className={inputCls}>{cityOptions}</select></Field>
      <div className="sm:col-span-2">
        <Field label="Product / interest">
          <select defaultValue={defaultProduct ?? ""} className={inputCls}>
            <option value="">Other / not sure</option>
            {products.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Quantity"><input type="number" min={1} defaultValue={10} className={inputCls} /></Field>
      <Field label="Needed by" hint="(optional)"><input type="date" className={inputCls} /></Field>
      <div className="sm:col-span-2">
        <Field label="Message"><textarea rows={4} placeholder="Sizes, depths, delivery location, anything else..." className={inputCls} /></Field>
      </div>
      <div className="sm:col-span-2"><Button type="submit" className="w-full">Request quote</Button></div>
    </form>
  );
}

export function ContactForm() {
  const [done, setDone] = useState(false);
  if (done) return <Success title="Message sent">Thanks! Our team will get back to you within 1 business day.</Success>;
  return (
    <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="space-y-4 rounded-2xl border border-line bg-white p-6 shadow-[var(--shadow)]">
      <Field label="Name"><input required className={inputCls} /></Field>
      <Field label="Mobile or email"><input required className={inputCls} /></Field>
      <Field label="Message"><textarea required rows={4} className={inputCls} /></Field>
      <Button type="submit">Send message</Button>
    </form>
  );
}

// ---- Dealer registration -----------------------------------------------------
const STATE_CODES: Record<string, string> = {
  "07": "Delhi", "19": "West Bengal", "21": "Odisha", "24": "Gujarat", "27": "Maharashtra",
  "29": "Karnataka", "32": "Kerala", "33": "Tamil Nadu", "36": "Telangana", "37": "Andhra Pradesh",
};
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

function checkGstin(raw: string): { ok: boolean; msg: string; state?: string } {
  const g = raw.trim().toUpperCase();
  if (!g) return { ok: false, msg: "GSTIN is mandatory." };
  if (g.length < 15) return { ok: false, msg: `${g.length}/15 characters.` };
  if (!GSTIN_RE.test(g)) return { ok: false, msg: "Invalid format. Example: 36AABCR1234F1Z5" };
  const state = STATE_CODES[g.slice(0, 2)];
  if (!state) return { ok: false, msg: `Unknown state code "${g.slice(0, 2)}".` };
  return { ok: true, msg: `Valid format. State code ${g.slice(0, 2)} = ${state}.`, state };
}

export function DealerRegistrationForm() {
  const [business, setBusiness] = useState("");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpOk, setOtpOk] = useState(false);
  const [otpErr, setOtpErr] = useState("");
  const [gstin, setGstin] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const g = checkGstin(gstin);
  const phoneOk = /^[6-9]\d{9}$/.test(phone);

  if (done)
    return (
      <Success title="Application submitted - pending manual review" action={<LinkButton href="/" variant="ghost">Back to store</LinkButton>}>
        <p>Thanks{business ? `, ${business}` : ""}. You can browse with retail prices while we review your application.</p>
        <ol className="mx-auto mt-4 max-w-sm space-y-2 text-left">
          {[
            "Your account is created with status Pending Manual Review.",
            "Our sales team gets a lead and a task to review your GSTIN and documents.",
            "We approve you and assign a price tier, home warehouse, credit limit and payment terms.",
            "You get an email and WhatsApp message. Trade prices (ex-GST) show on your next sign-in.",
          ].map((t, i) => (
            <li key={t} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">{i + 1}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </Success>
    );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpOk) return setError("Please verify your mobile number with the OTP.");
    if (!g.ok) return setError(`GSTIN: ${g.msg}`);
    setError("");
    setDone(true);
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6">
      <Card className="grid gap-4 p-6 sm:grid-cols-2">
        <h2 className="font-bold sm:col-span-2">Business details</h2>
        <Field label="Business name"><input required value={business} onChange={(e) => setBusiness(e.target.value)} className={inputCls} /></Field>
        <Field label="Contact person"><input required className={inputCls} /></Field>
        <Field label="Email"><input type="email" required className={inputCls} /></Field>
        <Field label="Delivery city"><select className={inputCls}>{cityOptions}</select></Field>
        <div className="sm:col-span-2">
          <Field label="Full address"><textarea required rows={2} className={inputCls} /></Field>
        </div>
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="font-bold">Mobile verification</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <Field label="Mobile number">
              <input
                value={phone} inputMode="numeric" maxLength={10} disabled={otpOk}
                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setOtpSent(false); }}
                className={inputCls}
              />
            </Field>
          </div>
          {!otpOk && <Button type="button" variant="ghost" disabled={!phoneOk} onClick={() => { setOtpSent(true); setOtpErr(""); }}>{otpSent ? "Resend OTP" : "Send OTP"}</Button>}
          {otpOk && <Badge tone="green">Verified</Badge>}
        </div>
        {otpSent && !otpOk && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-40">
              <Field label="Enter OTP"><input value={otp} maxLength={6} inputMode="numeric" onChange={(e) => setOtp(e.target.value)} className={inputCls} /></Field>
            </div>
            <Button type="button" onClick={() => (otp === "123456" ? setOtpOk(true) : setOtpErr("Wrong OTP."))}>Verify</Button>
            <p className="pb-2 text-xs text-muted">Demo OTP: <b>123456</b></p>
            {otpErr && <p className="pb-2 text-xs text-red-600">{otpErr}</p>}
          </div>
        )}
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="font-bold">GST details</h2>
        <Field label="GSTIN" hint="(mandatory)">
          <input
            value={gstin} maxLength={15}
            onChange={(e) => { setGstin(e.target.value.toUpperCase()); setVerified(false); }}
            className={clsx(inputCls, "uppercase tracking-wide", gstin && (g.ok ? "!border-emerald-400" : "!border-red-300"))}
            placeholder="36AABCR1234F1Z5"
          />
        </Field>
        <p className={clsx("text-xs", g.ok ? "text-emerald-700" : gstin ? "text-red-600" : "text-muted")}>
          {gstin ? g.msg : "15 characters. The first two digits are the state code."}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button" variant="ghost" disabled={!g.ok}
            onClick={() => { setVerified(true); setBusiness("Sample Traders Pvt Ltd"); }}
          >
            Verify GSTIN (mock)
          </Button>
          {verified && <Badge tone="green">Registered name: Sample Traders Pvt Ltd</Badge>}
        </div>
        <div className="grid gap-4 pt-2 sm:grid-cols-2">
          <Field label="GST certificate" hint="(optional)"><input type="file" accept=".pdf,image/*" className={inputCls} /></Field>
          <Field label="Shop photo" hint="(optional)"><input type="file" accept="image/*" className={inputCls} /></Field>
        </div>
      </Card>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Button type="submit" className="w-full">Submit application</Button>
      <p className="text-center text-xs text-muted">Every application is reviewed manually before trade prices are shown. Prototype: nothing is sent.</p>
    </form>
  );
}
