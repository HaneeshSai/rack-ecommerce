import Link from "next/link";
import clsx from "clsx";
import { LinkButton, PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { CRM_STAGES, nextAction } from "@/lib/crm";
import { serializeCrm } from "@/lib/crm-data";
import { OrdersTable } from "@/components/crm/orders-table";

export default async function CrmOrders({ searchParams }: { searchParams: Promise<{ stage?: string; waiting?: string }> }) {
  await requireUser("CRM");
  const { stage, waiting } = await searchParams;
  const all = mock.S().crmOrders.map(serializeCrm);
  const late = all.filter((o) => o.urgency === "late" || o.urgency === "warn");
  const rows = (waiting ? late : stage ? all.filter((o) => o.stage === stage) : all).map((o) => ({
    id: o.id, number: o.number, dealerName: o.dealerName, dealerCity: o.dealerCity, fieldRep: o.fieldRep, terms: o.terms,
    hub: o.hub, total: o.total, stage: o.stage, overdueDays: o.overdueDays, createdAt: o.createdAt, next: nextAction(o), urgency: o.urgency, stageDays: o.stageDays, dealerId: o.dealerId,
  }));

  return (
    <>
      <PageTitle
        title="Sales orders"
        sub="Every order shows what to do next. Click one to continue. Amber means it has waited 2 days or more. Red means 4 days or more, or the dealer is late paying."
        action={<LinkButton href="/orders/new">+ New sales order</LinkButton>}
      />
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link href="/orders" className={clsx("rounded-full border px-3 py-1.5", !stage && !waiting ? "border-accent bg-accent-soft font-semibold" : "border-line bg-white")}>All ({all.length})</Link>
        <Link href="/orders?waiting=1" className={clsx("rounded-full border px-3 py-1.5", waiting ? "border-red-400 bg-red-50 font-semibold text-red-700" : "border-line bg-white text-red-700")}>Waiting too long ({late.length})</Link>
        {CRM_STAGES.map((s) => (
          <Link key={s.key} href={`/orders?stage=${s.key}`} className={clsx("rounded-full border px-3 py-1.5", stage === s.key ? "border-accent bg-accent-soft font-semibold" : "border-line bg-white")}>
            {s.label} ({all.filter((o) => o.stage === s.key).length})
          </Link>
        ))}
      </div>
      <OrdersTable rows={rows} />
    </>
  );
}
