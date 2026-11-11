import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { inr2 } from "@/lib/money";
import { WAREHOUSE_STATE } from "@/lib/gst";
import { PrintButton } from "@/components/dealer/print-button";
import { dealerState, orderItems } from "@/components/dealer/server";
import { dateStr } from "@/components/dealer/format";

export default async function InvoicePage({ params }: { params: Promise<{ number: string }> }) {
  const user = await requireUser("DEALER");
  const { number } = await params;
  const S = mock.S();
  const o = S.orders.find((x) => x.number === number && x.dealerId === user.dealerId);
  if (!o) notFound();
  const dealer = user.dealer!;

  const isTax = !!o.invoiceNo;
  const whCode = o.warehouses[0] ?? "HYD";
  const wh = S.warehouses.find((w) => w.code === whCode);
  const sellerState = WAREHOUSE_STATE[whCode] ?? "Telangana";
  const sellerGstin = S.settings.gstin[sellerState];
  const buyerState = dealerState(dealer);
  const items = orderItems(o.id);

  return (
    <div className="mx-auto max-w-3xl">
      <style>{`@media print { header, .no-print, body > div:first-child { display: none !important; } main { padding: 0 !important; max-width: none !important; } body { background: white !important; } }`}</style>
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href="/invoices" className="text-sm text-muted hover:text-foreground">&larr; All invoices</Link>
        <PrintButton />
      </div>

      <div className="space-y-6 rounded-2xl border border-line bg-white p-8 text-sm shadow-[var(--shadow)] print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
          <div>
            <div className="text-xl font-extrabold"><span className="text-accent">Rack</span>Hub Distribution</div>
            <p className="mt-1 text-muted">{wh?.name}, {wh?.city}, {sellerState}</p>
            <p className="text-muted">GSTIN: <b className="text-foreground">{sellerGstin}</b></p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold uppercase tracking-wide">{isTax ? "Tax Invoice" : "Proforma Invoice"}</div>
            <p>No: <b>{o.invoiceNo ?? o.proformaNo}</b></p>
            <p>Date: {dateStr(o.createdAt.toISOString())}</p>
            <p className="text-muted">Order {o.number}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Bill to</div>
            <p className="font-semibold">{o.customerName}</p>
            <p className="text-muted">{dealer.address}</p>
            <p>GSTIN: <b>{o.customerGstin ?? "-"}</b></p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Place of supply</div>
            <p className="font-semibold">{o.shipState}</p>
            <p className="text-muted">{o.igst > 0 ? "Inter-state supply: IGST" : "Intra-state supply: CGST + SGST"}</p>
            <p className="text-muted">Payment: {o.paymentMode.toLowerCase()}{o.dueDate ? ` (due ${dateStr(o.dueDate.toISOString())})` : ""}</p>
            <p className="text-muted">Delivery state: {buyerState}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-y border-line bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="p-2">Item</th><th className="p-2">HSN</th><th className="p-2 text-right">Qty</th>
                <th className="p-2 text-right">Rate</th><th className="p-2 text-right">GST</th><th className="p-2 text-right">Taxable value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((i) => (
                <tr key={i.id}>
                  <td className="p-2">{i.name} <span className="text-muted">({i.label})</span><div className="text-xs text-muted">{i.sku}</div></td>
                  <td className="p-2">{i.hsn}</td>
                  <td className="p-2 text-right">{i.qty}</td>
                  <td className="p-2 text-right">{inr2(i.unitPrice)}</td>
                  <td className="p-2 text-right">{i.gstRate}%</td>
                  <td className="p-2 text-right">{inr2(i.unitPrice * i.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ml-auto max-w-xs space-y-1">
          <Line k="Taxable value" v={inr2(o.subtotal)} />
          {o.igst > 0 ? (
            <Line k="IGST" v={inr2(o.igst)} />
          ) : (
            <>
              <Line k="CGST" v={inr2(o.cgst)} />
              <Line k="SGST" v={inr2(o.sgst)} />
            </>
          )}
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><span>Total</span><span>{inr2(o.total)}</span></div>
        </div>

        {!isTax && (
          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            <b>Pay by NEFT / RTGS:</b> {S.settings.bank}. Your tax invoice is issued once accounts confirms the payment.
          </div>
        )}
        {o.ewayRequired && <p className="text-xs text-muted">E-way bill required (consignment above Rs 50,000){o.ewayBill ? `: ${o.ewayBill}` : ""}.</p>}
        <p className="border-t border-line pt-3 text-xs text-muted">
          This is a computer-generated sample document for the prototype. Sample data only.
        </p>
      </div>
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><span className="text-muted">{k}</span><span>{v}</span></div>;
}
