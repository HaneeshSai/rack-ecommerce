import Link from "next/link";
import { Badge, Card, PageTitle, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { serializeCrm } from "@/lib/crm-data";
import { inr } from "@/lib/money";
import { fmtDate } from "@/components/admin/format";
import { AddCheque, ChequeActions } from "@/components/crm/cheque-forms";

const TONE = { RECEIVED: "gray", DEPOSITED: "blue", CLEARED: "green", BOUNCED: "red" } as const;
const BUCKETS = ["Not due yet", "1-15 days late", "16-30 days late", "Over 30 days late"];
const bucket = (late: number, due: boolean) => (!due || late <= 0 ? 0 : late <= 15 ? 1 : late <= 30 ? 2 : 3);

export default async function Collections() {
  await requireUser("CRM");
  const S = mock.S();
  const all = S.crmOrders.map(serializeCrm);
  const open = all.filter((o) => o.stage === "DOCS_SENT" && !o.payment);

  const rows = new Map<string, { name: string; city: string; b: number[]; total: number }>();
  for (const o of open) {
    const r = rows.get(o.dealerId) ?? { name: o.dealerName, city: o.dealerCity, b: [0, 0, 0, 0], total: 0 };
    r.b[bucket(o.overdueDays, !!o.dueDate)] += o.total;
    r.total += o.total;
    rows.set(o.dealerId, r);
  }
  const list = [...rows.entries()].sort((a, b) => b[1].b[3] + b[1].b[2] - (a[1].b[3] + a[1].b[2]) || b[1].total - a[1].total);
  const sum = (i: number) => list.reduce((n, [, r]) => n + r.b[i], 0);

  const today = new Date().toISOString().slice(0, 10);
  const cheques = S.cheques;
  const inHand = cheques.filter((c) => c.status === "RECEIVED" || c.status === "DEPOSITED");
  const bounced = cheques.filter((c) => c.status === "BOUNCED");
  const dname = (id: string) => S.dealers.find((d) => d.id === id)?.businessName ?? "Dealer";
  const onum = (id: string | null) => S.crmOrders.find((o) => o.id === id)?.number;

  return (
    <>
      <PageTitle title="Collections" sub="Who owes what, how late it is, and where each cheque stands." action={<Link href="/payments" className="text-sm font-semibold text-accent">&larr; Payments</Link>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total to collect" value={inr(sum(0) + sum(1) + sum(2) + sum(3))} />
        <StatCard label="Late over 15 days" value={inr(sum(2) + sum(3))} tone={sum(2) + sum(3) ? "warn" : "good"} />
        <StatCard label="Cheques not yet cleared" value={String(inHand.length)} />
        <StatCard label="Bounced cheques" value={String(bounced.length)} tone={bounced.length ? "warn" : "good"} />
      </div>

      <h2 className="mb-3 font-bold">Money owed, by dealer</h2>
      <Card className="mb-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-line text-left text-xs uppercase text-muted">
            <th className="p-3">Dealer</th>{BUCKETS.map((b) => <th key={b} className="p-3 text-right">{b}</th>)}<th className="p-3 text-right">Total</th>
          </tr></thead>
          <tbody>
            {list.map(([id, r]) => (
              <tr key={id} className="border-b border-line last:border-0">
                <td className="p-3 font-semibold"><Link href={`/dealers/${id}`} className="hover:text-accent">{r.name}</Link><div className="text-xs font-normal text-muted">{r.city}</div></td>
                {r.b.map((v, i) => <td key={i} className={`p-3 text-right ${v && i >= 2 ? "font-bold text-red-600" : v && i === 1 ? "font-semibold text-amber-600" : ""}`}>{v ? inr(v) : "-"}</td>)}
                <td className="p-3 text-right font-bold">{inr(r.total)}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted">Nobody owes anything.</td></tr>}
          </tbody>
        </table>
      </Card>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold">Cheque register</h2>
      </div>
      <Card className="mb-4 p-5">
        <h3 className="mb-3 text-sm font-bold">Add a cheque you received</h3>
        <AddCheque
          dealers={S.dealers.filter((d) => d.status === "APPROVED").map((d) => ({ id: d.id, name: d.businessName }))}
          orders={all.filter((o) => o.stage === "DOCS_SENT" && !o.payment).map((o) => ({ id: o.id, dealerId: o.dealerId, label: `${o.number} · ${inr(o.total)}` }))}
        />
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-line text-left text-xs uppercase text-muted">
            <th className="p-3">Cheque</th><th className="p-3">Dealer</th><th className="p-3 text-right">Amount</th><th className="p-3">Date on cheque</th><th className="p-3">Status</th><th className="p-3">Next</th>
          </tr></thead>
          <tbody>
            {cheques.map((c) => (
              <tr key={c.id} className="border-b border-line align-top last:border-0">
                <td className="p-3 font-semibold">{c.chequeNo}<div className="text-xs font-normal text-muted">{c.bank}{onum(c.orderId) ? ` · ${onum(c.orderId)}` : ""}</div></td>
                <td className="p-3">{dname(c.dealerId)}</td>
                <td className="p-3 text-right">{inr(c.amount)}</td>
                <td className="p-3">{fmtDate(c.chequeDate)} {c.chequeDate > today && c.status === "RECEIVED" && <Badge tone="amber">post-dated</Badge>}</td>
                <td className="p-3"><Badge tone={TONE[c.status]}>{c.status.charAt(0) + c.status.slice(1).toLowerCase()}</Badge><div className="mt-1 max-w-48 text-xs text-muted">{c.log[c.log.length - 1]?.text}</div></td>
                <td className="p-3"><ChequeActions id={c.id} status={c.status} /></td>
              </tr>
            ))}
            {cheques.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted">No cheques yet.</td></tr>}
          </tbody>
        </table>
      </Card>

      <h2 className="mb-3 mt-8 font-bold">Send to Accounts (Tally)</h2>
      <Card className="flex flex-wrap items-center gap-3 p-5 text-sm">
        <span className="text-muted">Download, then in TallyPrime use Import &gt; Vouchers. Ledger names must match Tally (Sales, Output CGST/SGST/IGST, Bank Account, Cheques in Hand).</span>
        <span className="flex flex-wrap gap-2">
          {[["Sales invoices (Tally)", "sales", ""], ["Receipts (Tally)", "receipts", ""], ["Sales (Excel)", "sales", "&format=csv"], ["Receipts (Excel)", "receipts", "&format=csv"]].map(([l, t, f]) => (
            <a key={l} href={`/api/crm/tally?type=${t}${f}`} className="rounded-lg border border-line px-3 py-1.5 font-semibold text-accent hover:bg-slate-50">{l}</a>
          ))}
        </span>
      </Card>
    </>
  );
}
