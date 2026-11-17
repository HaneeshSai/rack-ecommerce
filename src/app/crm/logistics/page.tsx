import Link from "next/link";
import { Badge, Card, PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { serializeCrm } from "@/lib/crm-data";
import { inr } from "@/lib/money";
import { StageBadge } from "@/components/crm/bits";

const ACTIVE = ["INVOICED", "LOGISTICS", "DISPATCHED"];
const NEXT: Record<string, string> = { INVOICED: "Book a vehicle", LOGISTICS: "Dispatch now", DISPATCHED: "Send documents to dealer" };

export default async function Logistics() {
  await requireUser("CRM");
  const S = mock.S();
  const orders = S.crmOrders.filter((o) => ACTIVE.includes(o.stage)).map(serializeCrm);

  return (
    <>
      <PageTitle title="Shipping" sub="Orders being shipped from each hub. See which need a vehicle, which are booked and which are on the road." />
      <div className="grid gap-6">
        {S.warehouses.map((w) => {
          const rows = orders.filter((o) => o.hub === w.code);
          const need = rows.filter((o) => o.stage === "INVOICED").length;
          return (
            <Card key={w.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-slate-50 px-5 py-3">
                <h2 className="font-bold">{w.city} hub <span className="font-normal text-muted">({w.code})</span></h2>
                <div className="flex gap-2 text-xs">
                  <Badge tone={need ? "amber" : "gray"}>{need} need a vehicle</Badge>
                  <Badge tone="blue">{rows.filter((o) => o.stage === "LOGISTICS").length} booked</Badge>
                  <Badge tone="blue">{rows.filter((o) => o.stage === "DISPATCHED").length} on the road</Badge>
                </div>
              </div>
              {rows.length === 0 ? (
                <p className="p-5 text-sm text-muted">Nothing to ship from this hub right now.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {rows.map((o) => (
                      <tr key={o.id} className="border-b border-line last:border-0 hover:bg-slate-50">
                        <td className="p-3 font-semibold"><Link href={`/orders/${o.id}`} className="text-accent hover:underline">{o.number}</Link></td>
                        <td className="p-3">{o.dealerName}<div className="text-xs text-muted">{o.dealerCity}</div></td>
                        <td className="p-3 text-right">{inr(o.total)}</td>
                        <td className="p-3">{o.vehicle ? <>{o.vehicle.provider} · {o.vehicle.vehicleNo}<div className="text-xs text-muted">{o.vehicle.driverName} {o.vehicle.driverPhone}</div></> : <span className="text-muted">No vehicle yet</span>}</td>
                        <td className="p-3"><StageBadge stage={o.stage} /></td>
                        <td className="p-3 text-right"><Link href={`/orders/${o.id}`} className="text-xs font-semibold text-accent">{NEXT[o.stage]} &rarr;</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
