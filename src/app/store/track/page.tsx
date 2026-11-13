import { redirect } from "next/navigation";
import { Card, inputCls, PageTitle } from "@/components/ui";
import { mock } from "@/lib/db";

const digits = (s: string) => s.replace(/\D/g, "").slice(-10);

// Track an order with the order number and the phone number used at checkout. No login.
export default async function TrackOrder({ searchParams }: { searchParams: Promise<{ number?: string; phone?: string }> }) {
  const { number, phone } = await searchParams;
  let error = "";
  if (number || phone) {
    const o = mock.S().orders.find((x) => x.number.toLowerCase() === (number ?? "").trim().toLowerCase());
    if (o && digits(o.customerPhone) === digits(phone ?? "") && digits(phone ?? "").length === 10) redirect(`/order/${o.number}`);
    error = "We could not find an order with that number and phone. Check both and try again.";
  }
  return (
    <div className="mx-auto max-w-md">
      <PageTitle title="Track your order" sub="Enter your order number and the phone number you used when ordering." />
      <Card className="space-y-4 p-6">
        <form method="GET" action="/track" className="space-y-3">
          <label className="block text-sm font-medium">Order number
            <input name="number" defaultValue={number} placeholder="RK-10006" required className={inputCls + " mt-1"} />
          </label>
          <label className="block text-sm font-medium">Phone number
            <input name="phone" defaultValue={phone} inputMode="numeric" placeholder="10-digit mobile" required className={inputCls + " mt-1"} />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110">Track order</button>
        </form>
        <p className="text-xs text-muted">Demo: order RK-10006 with phone 9000000099.</p>
      </Card>
    </div>
  );
}
