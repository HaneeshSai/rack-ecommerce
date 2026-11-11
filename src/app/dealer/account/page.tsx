import { PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { AccountClient, type AccountView } from "@/components/dealer/account-client";
import { TIER_LABEL } from "@/components/dealer/format";

export default async function DealerAccount() {
  const user = await requireUser("DEALER");
  const d = user.dealer!;
  const S = mock.S();
  const wh = S.warehouses.find((w) => w.code === d.homeWarehouse);
  const owner = S.users.find((u) => u.dealerId === d.id);
  const a: AccountView = {
    businessName: d.businessName, gstin: d.gstin, gstVerified: d.gstVerified, contactName: d.contactName, phone: d.phone,
    email: d.email, city: d.city, address: d.address, status: d.status, tier: TIER_LABEL[d.tier],
    homeWarehouse: wh?.city ?? d.homeWarehouse, termsDays: d.termsDays, creditLimit: d.creditLimit, creditUsed: d.creditUsed,
    rep: d.assignedRep, addresses: d.addresses,
    users: owner ? [{ name: owner.name, email: owner.email, role: "Owner" }] : [],
  };
  return (
    <>
      <PageTitle title="Account" sub="Business details, delivery addresses and team logins." />
      <AccountClient a={a} />
    </>
  );
}
