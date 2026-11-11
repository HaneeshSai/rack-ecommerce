import { PageTitle } from "@/components/ui";
import { requireStaff } from "@/lib/session";
import { mock } from "@/lib/db";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettings() {
  await requireStaff("settings");
  const s = mock.S().settings;
  return (
    <>
      <PageTitle title="Settings" sub="Freight rates, city-to-warehouse map, payment and credit rules, invoice series and message templates. Edits here are a demo and are not saved." />
      <SettingsForm
        initial={{
          holdDays: s.holdDays, discountApprovalPct: s.discountApprovalPct, splitDefault: s.splitDefault, lowStock: s.lowStock,
          blockOverdueCredit: s.blockOverdueCredit, inactiveDays: s.inactiveDays, invoiceSeries: s.invoiceSeries, bank: s.bank,
          gstin: s.gstin, freight: s.freight, cities: s.cities,
        }}
      />
    </>
  );
}
