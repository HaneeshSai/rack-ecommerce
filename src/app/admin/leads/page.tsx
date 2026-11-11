import { Button, Card, PageTitle } from "@/components/ui";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { setLeadStatus } from "@/lib/actions/admin";

const STATUSES = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST"];

export default async function AdminLeads() {
  await requireUser("ADMIN");
  const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageTitle title="CRM leads" sub="Enquiries from the website and WhatsApp." />
      <div className="grid gap-3 md:grid-cols-2">
        {leads.map((l) => (
          <Card key={l.id} className="p-4 text-sm">
            <div className="flex justify-between">
              <b>{l.name}{l.company ? ` - ${l.company}` : ""}</b>
              <span className="text-muted">{l.source}</span>
            </div>
            <p className="mt-1 text-muted">{l.interest}</p>
            <p className="text-muted">{l.phone}</p>
            <form action={setLeadStatus.bind(null, l.id)} className="mt-3 flex gap-2">
              <select name="status" defaultValue={l.status} className="rounded-lg border border-line px-2 py-1">
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <Button variant="ghost" className="!py-1">Save</Button>
            </form>
          </Card>
        ))}
      </div>
    </>
  );
}
