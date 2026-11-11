import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { mock } from "@/lib/db";
import { inr2 } from "@/lib/money";
import { WAREHOUSES } from "@/lib/logistics";
import { fmtDate } from "@/components/admin/format";
import { orderItems } from "@/components/admin/data";
import { PrintButton } from "@/components/admin/print-button";

export default async function InvoicePage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  await requireStaff("orders");
  const S = mock.S();
  const o = S.orders.find((x) => x.number === number);
  if (!o) notFound();

  const wh = WAREHOUSES.find((w) => w.code === o.warehouses[0]) ?? WAREHOUSES[0];
  const sellerGstin = S.settings.gstin[wh.state] ?? "";
  const items = orderItems(o);
  const retail = o.buyerType === "RETAIL"; // retail unit prices include GST
  const lines = items.map((i) => {
    const gross = i.unitPrice * i.qty;
    const taxable = retail ? Math.round((gross * 100) / (100 + i.gstRate)) : gross;
    return { ...i, taxable };
  });
  const igst = o.igst > 0;
  const proforma = !o.invoiceNo;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={`/orders/${o.number}`} className="text-sm text-muted hover:text-foreground">&larr; Back to order</Link>
        <PrintButton label="Print / save as PDF" />
      </div>
      <div className="rounded-2xl border border-line bg-white p-8 text-sm shadow-[var(--shadow)] print:border-0 print:p-0 print:shadow-none">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <div className="text-xl font-extrabold"><span className="text-accent">Rack</span>Hub</div>
            <div className="mt-1 text-muted">{wh.city} warehouse, {wh.state}</div>
            <div>GSTIN: <b>{sellerGstin}</b></div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{proforma ? "PROFORMA INVOICE" : "TAX INVOICE"}</div>
            <div>No: <b>{o.invoiceNo ?? o.proformaNo ?? `PF/${o.number}`}</b></div>
            <div>Date: {fmtDate(o.createdAt.toISOString())}</div>
            <div>Order: {o.number}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase text-muted">Bill to</div>
            <div className="font-semibold">{o.customerName}</div>
            <div>{o.city}, {o.shipState}</div>
            <div>{o.customerPhone}</div>
            {o.customerGstin && <div>GSTIN: {o.customerGstin}</div>}
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-muted">Place of supply</div>
            <div className="font-semibold">{o.shipState}</div>
            <div className="text-muted">{igst ? "Inter-state supply: IGST" : "Intra-state supply: CGST + SGST"}</div>
          </div>
        </div>

        <table className="mt-6 w-full">
          <thead className="border-y border-line text-left text-xs uppercase text-muted">
            <tr><th className="py-2">Description</th><th className="py-2">HSN</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Taxable</th><th className="py-2 text-right">GST %</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {lines.map((l) => (
              <tr key={l.sku}>
                <td className="py-2">{l.name}<div className="text-xs text-muted">{l.label} - {l.sku}</div></td>
                <td className="py-2">{l.hsn}</td>
                <td className="py-2 text-right">{l.qty}</td>
                <td className="py-2 text-right">{inr2(l.taxable)}</td>
                <td className="py-2 text-right">{l.gstRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto max-w-xs space-y-1">
          <div className="flex justify-between"><span className="text-muted">Taxable value</span><span>{inr2(o.subtotal)}</span></div>
          {igst ? (
            <div className="flex justify-between"><span className="text-muted">IGST</span><span>{inr2(o.igst)}</span></div>
          ) : (
            <>
              <div className="flex justify-between"><span className="text-muted">CGST</span><span>{inr2(o.cgst)}</span></div>
              <div className="flex justify-between"><span className="text-muted">SGST</span><span>{inr2(o.sgst)}</span></div>
            </>
          )}
          {o.shipping > 0 && <div className="flex justify-between"><span className="text-muted">Freight</span><span>{inr2(o.shipping)}</span></div>}
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><span>Total</span><span>{inr2(o.total)}</span></div>
        </div>

        {proforma ? (
          <p className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-muted">
            Pay by NEFT / RTGS: {S.settings.bank}. Quote the order number as reference. The tax invoice is issued once payment is matched.
          </p>
        ) : (
          <p className="mt-6 text-xs text-muted">Invoice numbers run in one continuous series per GSTIN and financial year. Prototype document: sample data.</p>
        )}
        {o.ewayBill && <p className="mt-2 text-xs">E-way bill: {o.ewayBill}</p>}
      </div>
    </div>
  );
}
