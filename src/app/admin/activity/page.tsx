import { Card, PageTitle } from "@/components/ui";
import { requireStaff } from "@/lib/session";
import { mock } from "@/lib/db";
import { fmtDateTime } from "@/components/admin/format";

export default async function AdminActivity() {
  await requireStaff("activity");
  const S = mock.S();
  return (
    <>
      <PageTitle title="Activity log" sub="Every price change, stock adjustment, approval and override, with who did it and when." />
      <Card className="divide-y divide-line">
        {S.activity.map((a) => (
          <div key={a.id} className="flex flex-wrap items-start justify-between gap-3 p-4 text-sm">
            <span>{a.action}</span>
            <span className="shrink-0 text-xs text-muted">{a.who} - {fmtDateTime(a.at.toISOString())}</span>
          </div>
        ))}
      </Card>
    </>
  );
}
