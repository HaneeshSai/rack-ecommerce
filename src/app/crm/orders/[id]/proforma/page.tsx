import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { serializeCrm } from "@/lib/crm-data";
import { inr2 } from "@/lib/money";
import { fmtDate } from "@/components/admin/format";
import { PrintButton } from "@/components/admin/print-button";

// Simple printable proforma for NEFT/RTGS payments. Prototype layout.
export default async function CrmProforma({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("CRM");
  const { id } = await params;
  const S = mock.S();
  const raw = S.crmOrders.find((x) => x.id === id);
  if (!raw) notFound();
  const o = serializeCrm(raw);
  const dealer = S.dealers.find((d) => d.id === o.dealerId);
  const no = o.proformaNo ?? `PF/${o.number}`;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={`/orders/${o.id}`} className="text-sm text-muted hover:text-accent">&larr; Back to {o.number}</Link>
        <PrintButton label="Print proforma" />
      </div>
      <div className="rounded-2xl border border-line bg-white p-8 shadow-[var(--shadow)] print:border-0 print:shadow-none">
        <div className="flex justify-between border-b border-line pb-4">
          <div>
            <div className="text-xl font-extrabold">RackHub Distribution</div>
            <div className="text-xs text-muted">Hyderabad · Vijayawada · Tirupati</div>
          </div>
          <div className="text-right text-sm">
            <div className="text-lg font-bold">PROFORMA INVOICE</div>
            <div>{no}</div><div className="text-muted">Date {fmtDate(new Date().toISOString())}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 py-4 text-sm">
          <div><div className="text-xs uppercase text-muted">Bill to</div><b>{o.dealerName}</b><br />{dealer?.address}<br />GSTIN {dealer?.gstin}</div>
          <div><div className="text-xs uppercase text-muted">Order</div>{o.number}<br />Dispatch hub {o.hub}<br />Terms: {o.terms}</div>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-y border-line text-left text-xs uppercase text-muted"><th className="py-2">Item</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Rate</th><th className="py-2 text-right">Amount</th></tr></thead>
          <tbody>
            {o.lines.map((l, i) => (
              <tr key={i} className="border-b border-line"><td className="py-2">{l.name} <span className="text-muted">({l.label})</span></td><td className="py-2 text-right">{l.qty}</td><td className="py-2 text-right">{inr2(l.price)}</td><td className="py-2 text-right">{inr2(l.qty * l.price)}</td></tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={3} className="pt-3 text-right text-muted">Subtotal</td><td className="pt-3 text-right">{inr2(o.sub)}</td></tr>
            <tr><td colSpan={3} className="text-right text-muted">GST</td><td className="text-right">{inr2(o.gst)}</td></tr>
            <tr className="text-base font-bold"><td colSpan={3} className="pt-1 text-right">Total payable</td><td className="pt-1 text-right">{inr2(o.total)}</td></tr>
          </tfoot>
        </table>
        <div className="mt-6 rounded-lg bg-slate-50 p-4 text-xs">
          <div className="font-semibold">Pay by NEFT / RTGS to</div>
          <div>{S.settings.bank}</div>
          <div className="mt-1 text-muted">Please quote {no} as the payment reference. Goods are dispatched after the payment clears.</div>
        </div>
      </div>
    </div>
  );
}
