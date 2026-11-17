import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, LinkButton, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { serializeCrm, overdueFor, dealerHealth } from "@/lib/crm-data";
import { waLink } from "@/lib/crm";
import { inr } from "@/lib/money";
import { fmtDate, fmtDateTime, STATUS_LABEL } from "@/components/admin/format";
import { StageBadge, ageText } from "@/components/crm/bits";
import { CreditHold } from "@/components/crm/credit-hold";
import { HealthBadge } from "@/components/crm/bits";
import { CallLogger } from "@/components/crm/call-logger";

export default async function DealerProfile({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("CRM");
  const { id } = await params;
  const S = mock.S();
  const d = S.dealers.find((x) => x.id === id);
  if (!d) notFound();

  const crm = S.crmOrders.filter((o) => o.dealerId === d.id).map(serializeCrm).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const store = S.orders.filter((o) => o.dealerId === d.id).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const tickets = S.tickets.filter((t) => t.dealerId === d.id);
  const quotes = S.quotes.filter((q) => q.dealerId === d.id);
  const calls = S.activity.filter((a) => a.action.includes(d.businessName)).slice(0, 6);
  const sales = crm.reduce((n, o) => n + o.total, 0) + store.filter((o) => o.status !== "CANCELLED").reduce((n, o) => n + o.total, 0);
  const usedPct = d.creditLimit > 0 ? Math.min(100, Math.round((d.creditUsed / d.creditLimit) * 100)) : 0;
  const overdue = overdueFor(d);
  const h = dealerHealth(d);
  const lastOrder = [...crm.map((o) => o.createdAt), ...store.map((o) => o.createdAt.toISOString())].sort().at(-1);

  return (
    <>
      <Link href="/dealers" className="text-sm text-muted hover:text-accent">&larr; Dealer network</Link>
      <div className="mb-6 mt-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{d.businessName}</h1>
          <p className="text-sm text-muted">{d.contactName} · {d.city} · GSTIN {d.gstin}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={d.status === "APPROVED" ? "green" : d.status === "PENDING" ? "amber" : "red"}>{d.status.toLowerCase()}</Badge>
            <Badge tone="blue">{d.tier.toLowerCase()} tier</Badge>
            <Badge tone="gray">{d.homeWarehouse} hub</Badge>
            {d.gstVerified ? <Badge tone="green">GSTIN verified</Badge> : <Badge tone="amber">GSTIN not verified</Badge>}
            {overdue > 0 && <Badge tone="red">{overdue} overdue</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={`tel:${d.phone}`} className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold hover:border-slate-300">Call {d.phone}</a>
          <a href={waLink(d.phone, `Hello ${d.contactName}, this is the RackHub team.`)} target="_blank" rel="noreferrer" className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold hover:border-slate-300">WhatsApp</a>
          <LinkButton href={`/orders/new?dealer=${d.id}`}>+ New order</LinkButton>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total orders" value={String(crm.length + store.length)} />
        <StatCard label="Total sales" value={inr(sales)} />
        <StatCard label="Outstanding" value={inr(d.creditUsed)} tone={overdue ? "warn" : undefined} />
        <StatCard label="Credit available" value={inr(Math.max(0, d.creditLimit - d.creditUsed))} tone="good" />
      </div>

      <Card className="mb-6 p-5 text-sm">
        <div className="mb-2 flex justify-between"><span className="font-semibold">Credit used</span><span>{inr(d.creditUsed)} of {inr(d.creditLimit)} · {d.termsDays ? `${d.termsDays}-day terms` : "advance only"}</span></div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${usedPct > 85 ? "bg-red-500" : "bg-accent"}`} style={{ width: `${usedPct}%` }} /></div>
        <p className="mt-2 text-xs text-muted">Last order: {lastOrder ? `${fmtDate(lastOrder)} (${ageText(lastOrder)})` : "never"} · {d.email} · {d.address}</p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-bold">Sales orders ({crm.length})</h2>
          <ul className="divide-y divide-line text-sm">
            {crm.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link href={`/orders/${o.id}`} className="font-semibold text-accent hover:underline">{o.number}</Link>
                <span className="flex-1 text-muted">{inr(o.total)} · {o.terms}</span>
                <StageBadge stage={o.stage} />
              </li>
            ))}
            {crm.length === 0 && <li className="py-3 text-muted">None yet.</li>}
          </ul>
          <h2 className="mb-3 mt-6 font-bold">Website orders ({store.length})</h2>
          <ul className="divide-y divide-line text-sm">
            {store.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="font-semibold">{o.number}</span>
                <span className="flex-1 text-muted">{inr(o.total)} · {fmtDate(o.createdAt.toISOString())}</span>
                <Badge tone="gray">{STATUS_LABEL[o.status]}</Badge>
              </li>
            ))}
            {store.length === 0 && <li className="py-3 text-muted">None yet.</li>}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Calls and notes</h2><CallLogger dealerId={d.id} /></div>
            <ul className="space-y-2 text-sm">
              {[...crm.flatMap((o) => o.followups.map((f) => ({ at: f.at, text: `${o.number}: ${f.note}`, by: f.by }))), ...calls.map((a) => ({ at: a.at.toISOString(), text: a.action, by: a.who }))]
                .sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8).map((x, i) => (
                  <li key={i} className="rounded-lg bg-slate-50 p-2.5">{x.text}<div className="text-xs text-muted">{x.by} · {fmtDateTime(x.at)}</div></li>
                ))}
            </ul>
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 font-bold">Support tickets ({tickets.length})</h2>
            <ul className="space-y-2 text-sm">
              {tickets.map((t) => <li key={t.id} className="flex justify-between gap-2"><span>{t.number} · {t.subject}</span><Badge tone={t.status === "RESOLVED" ? "green" : "amber"}>{t.status.replace("_", " ").toLowerCase()}</Badge></li>)}
              {tickets.length === 0 && <li className="text-muted">No tickets.</li>}
            </ul>
            <h2 className="mb-3 mt-5 font-bold">Quotes ({quotes.length})</h2>
            <ul className="space-y-2 text-sm">
              {quotes.map((q) => <li key={q.id} className="flex justify-between gap-2"><span>{q.number} · valid till {fmtDate(q.validUntil.toISOString())}</span><Badge tone="blue">{q.status.replace("_", " ").toLowerCase()}</Badge></li>)}
              {quotes.length === 0 && <li className="text-muted">No quotes.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
