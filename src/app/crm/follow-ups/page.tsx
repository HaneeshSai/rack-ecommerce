import { Badge, Card, PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { inr } from "@/lib/money";
import { fmtDate } from "@/components/admin/format";
import { FollowupButton } from "@/components/crm/followup-button";

const day = (d: Date) => Math.floor((Date.now() - d.getTime()) / 864e5);

export default async function FollowUps() {
  await requireUser("CRM");
  const S = mock.S();
  const leads = S.leads.filter((l) => !["WON", "LOST"].includes(l.status)).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const quotes = S.quotes.filter((q) => ["SENT", "PENDING_APPROVAL"].includes(q.status));
  const tasks = S.tasks.filter((t) => !t.done);

  return (
    <>
      <PageTitle title="Follow-ups" sub="Dealer enquiries and open quotes that need a nudge. Create a task so nothing is forgotten." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-bold">Open enquiries ({leads.length})</h2>
          <Card className="divide-y divide-line">
            {leads.map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-3 p-4 text-sm">
                <div>
                  <div className="font-semibold">{l.company ?? l.name} <span className="font-normal text-muted">· {l.city}</span></div>
                  <div>{l.interest}</div>
                  <div className="mt-1 flex gap-2 text-xs text-muted"><Badge tone="blue">{l.status.replace("_", " ").toLowerCase()}</Badge>{l.source} · {day(l.createdAt)} days old · {l.phone}</div>
                </div>
                <FollowupButton title={`Follow up enquiry: ${l.company ?? l.name} (${l.interest})`} refId={l.id} />
              </div>
            ))}
          </Card>
        </div>
        <div>
          <h2 className="mb-3 font-bold">Open quotes ({quotes.length})</h2>
          <Card className="divide-y divide-line">
            {quotes.map((q) => {
              const total = q.items.reduce((n, i) => n + i.qty * i.unitPrice, 0);
              const name = S.dealers.find((d) => d.id === q.dealerId)?.businessName ?? "Lead";
              return (
                <div key={q.id} className="flex items-start justify-between gap-3 p-4 text-sm">
                  <div>
                    <div className="font-semibold">{q.number} <span className="font-normal text-muted">· {name}</span></div>
                    <div>{inr(total)} ex-GST · valid until {fmtDate(q.validUntil.toISOString())}</div>
                    <div className="mt-1 text-xs text-muted">{q.status === "PENDING_APPROVAL" ? "Waiting for manager approval" : `Sent ${day(q.createdAt)} days ago, no reply`}</div>
                  </div>
                  <FollowupButton title={`Follow up quote ${q.number} with ${name}`} refId={q.number} />
                </div>
              );
            })}
            {quotes.length === 0 && <p className="p-5 text-sm text-muted">No open quotes.</p>}
          </Card>
        </div>
      </div>

      <h2 className="mb-3 mt-8 font-bold">Open tasks ({tasks.length})</h2>
      <Card className="divide-y divide-line">
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-4 text-sm">
            <span>{t.title}</span><span className="text-xs text-muted">{t.owner} · due {fmtDate(t.due.toISOString())}</span>
          </div>
        ))}
      </Card>
    </>
  );
}
