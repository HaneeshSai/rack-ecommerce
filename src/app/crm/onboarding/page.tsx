import { Badge, Card, PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { gstinFormatOk } from "@/lib/crm";
import { OnboardingCard } from "@/components/crm/onboarding-card";
import { fmtDate } from "@/components/admin/format";

export default async function Onboarding() {
  await requireUser("CRM");
  const S = mock.S();
  const hubs = S.warehouses.map((w) => ({ code: w.code, city: w.city }));
  const toDto = (d: (typeof S.dealers)[number]) => ({
    id: d.id, businessName: d.businessName, gstin: d.gstin, gstVerified: d.gstVerified, formatOk: gstinFormatOk(d.gstin),
    contactName: d.contactName, phone: d.phone, email: d.email, city: d.city, address: d.address, status: d.status,
    tier: d.tier, hub: d.homeWarehouse, creditLimit: Math.round(d.creditLimit / 100), termsDays: d.termsDays, appliedAt: d.appliedAt.toISOString(),
  });
  const pending = S.dealers.filter((d) => d.status === "PENDING").map(toDto);
  const done = S.dealers.filter((d) => d.status !== "PENDING");

  return (
    <>
      <PageTitle title="Dealer onboarding" sub="Review new trade partners: check the GSTIN, confirm the profile, then approve with a tier, hub and credit terms." />
      <h2 className="mb-3 font-bold">Waiting for review ({pending.length})</h2>
      {pending.length === 0 && <Card className="p-6 text-sm text-muted">No applications waiting.</Card>}
      <div className="space-y-4">
        {pending.map((d) => <OnboardingCard key={d.id} dealer={d} hubs={hubs} />)}
      </div>

      <h2 className="mb-3 mt-10 font-bold">Already reviewed</h2>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-line text-left text-xs uppercase text-muted"><th className="p-3">Dealer</th><th className="p-3">City</th><th className="p-3">GSTIN</th><th className="p-3">Hub</th><th className="p-3">Applied</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {done.map((d) => (
              <tr key={d.id} className="border-b border-line last:border-0">
                <td className="p-3 font-semibold">{d.businessName}</td><td className="p-3">{d.city}</td>
                <td className="p-3">{d.gstin} {d.gstVerified && <span className="text-emerald-600">verified</span>}</td>
                <td className="p-3">{d.homeWarehouse}</td><td className="p-3">{fmtDate(d.appliedAt.toISOString())}</td>
                <td className="p-3"><Badge tone={d.status === "APPROVED" ? "green" : "red"}>{d.status.toLowerCase()}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
