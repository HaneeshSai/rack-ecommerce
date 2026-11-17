import Link from "next/link";
import { Badge, Card, PageTitle, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { inr } from "@/lib/money";
import { fmtDate } from "@/components/admin/format";
import { ClaimActions, NewClaim } from "@/components/crm/claim-forms";

const KIND = { DAMAGED: "Damaged", MISSING: "Missing", WRONG_ITEM: "Wrong item" } as const;
const TONE = { OPEN: "amber", APPROVED: "blue", REJECTED: "red", CLOSED: "green" } as const;

export default async function Claims() {
  await requireUser("CRM");
  const S = mock.S();
  const dname = (id: string) => S.dealers.find((d) => d.id === id)?.businessName ?? "Dealer";
  const onum = (id: string) => S.crmOrders.find((o) => o.id === id)?.number ?? "";
  const open = S.claims.filter((c) => c.status === "OPEN" || c.status === "APPROVED");
  const credit = S.claims.filter((c) => c.outcome === "CREDIT_NOTE").reduce((n, c) => n + c.creditAmount, 0);

  return (
    <>
      <PageTitle title="Claims" sub="Damaged, missing or wrong items. Dealers must report within 48 hours of delivery." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Claims to handle" value={String(open.length)} tone={open.length ? "warn" : "good"} />
        <StatCard label="Closed" value={String(S.claims.filter((c) => c.status === "CLOSED").length)} />
        <StatCard label="Credit notes given" value={inr(credit)} />
      </div>

      <Card className="mb-8 p-5">
        <h2 className="mb-3 font-bold">Raise a claim for a dealer</h2>
        <NewClaim orders={S.crmOrders.filter((o) => ["DISPATCHED", "DOCS_SENT", "PAID"].includes(o.stage)).map((o) => ({ id: o.id, label: `${o.number} · ${dname(o.dealerId)}` }))} />
      </Card>

      <div className="grid gap-4">
        {S.claims.map((c) => {
          const late = c.hoursAfterDelivery > 48;
          return (
            <Card key={c.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-bold">{c.number} · {KIND[c.kind]}: {c.item} <span className="font-normal text-muted">x{c.qty}</span></div>
                  <div className="mt-0.5 text-sm text-muted">{dname(c.dealerId)} · <Link href={`/orders/${c.orderId}`} className="text-accent hover:underline">{onum(c.orderId)}</Link> · raised {fmtDate(c.raisedAt.toISOString())}</div>
                </div>
                <div className="flex gap-2">
                  {late && <Badge tone="red">after 48 hours</Badge>}
                  <Badge tone="gray">{c.photos} photo{c.photos === 1 ? "" : "s"}</Badge>
                  <Badge tone={TONE[c.status]}>{c.status.charAt(0) + c.status.slice(1).toLowerCase()}</Badge>
                </div>
              </div>
              {c.note && <p className="mt-2 text-sm">{c.note}</p>}
              {c.kind !== "MISSING" && c.photos === 0 && c.status === "OPEN" && <p className="mt-2 text-xs font-semibold text-amber-700">Ask the dealer for photos before deciding.</p>}
              <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                <div className="text-xs text-muted">
                  {c.log[c.log.length - 1].text}
                  {c.outcome === "CREDIT_NOTE" && ` · ${inr(c.creditAmount)}${c.creditNoteNo ? ` · ${c.creditNoteNo}` : ""}`}
                </div>
                <ClaimActions id={c.id} status={c.status} outcome={c.outcome} />
              </div>
            </Card>
          );
        })}
        {S.claims.length === 0 && <Card className="p-8 text-center text-muted">No claims.</Card>}
      </div>
    </>
  );
}
