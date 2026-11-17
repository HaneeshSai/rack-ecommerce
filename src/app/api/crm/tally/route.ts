import { mock } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { crmTotals } from "@/lib/crm-data";

// Export for Accounts: sales invoices and receipts as Tally import XML, or as CSV.
//   /api/crm/tally?type=sales | receipts   (XML, TallyPrime: Import > Vouchers)
//   add &format=csv for a spreadsheet instead.
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
const rs = (paise: number) => (paise / 100).toFixed(2);
const csvCell = (v: string | number | null) => `"${String(v).replace(/"/g, '""')}"`;

export async function GET(req: Request) {
  if (!(await currentUser("CRM"))) return new Response("Sign in to the CRM portal first.", { status: 401 });
  const url = new URL(req.url);
  const type = url.searchParams.get("type") === "receipts" ? "receipts" : "sales";
  const csv = url.searchParams.get("format") === "csv";
  const S = mock.S();
  const dealer = (id: string) => S.dealers.find((d) => d.id === id);

  if (type === "sales") {
    const rows = S.crmOrders.filter((o) => o.invoiceNo).map((o) => {
      const d = dealer(o.dealerId);
      const t = crmTotals(o);
      const date = o.timeline.find((x) => x.text.startsWith("Invoice"))?.at ?? o.createdAt;
      const intra = (d?.gstin ?? "").startsWith("36"); // seller is in Telangana
      return { o, d, t, date, intra };
    });
    if (csv) {
      const head = ["Date", "Invoice no", "Order", "Dealer", "GSTIN", "Taxable value", "GST", "Total", "Terms"];
      const body = rows.map(({ o, d, t, date }) => [ymd(date), o.invoiceNo, o.number, d?.businessName ?? "", d?.gstin ?? "", rs(t.sub), rs(t.gst), rs(t.total), o.terms]);
      return file([head, ...body].map((r) => r.map(csvCell).join(",")).join("\r\n"), "text/csv", "sales-invoices.csv");
    }
    const v = rows.map(({ o, d, t, date, intra }) => {
      const party = esc(d?.businessName ?? "Unknown dealer");
      const half = rs(t.gst / 2);
      const tax = intra
        ? `<ALLLEDGERENTRIES.LIST><LEDGERNAME>Output CGST</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${half}</AMOUNT></ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST><LEDGERNAME>Output SGST</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${half}</AMOUNT></ALLLEDGERENTRIES.LIST>`
        : `<ALLLEDGERENTRIES.LIST><LEDGERNAME>Output IGST</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${rs(t.gst)}</AMOUNT></ALLLEDGERENTRIES.LIST>`;
      return `<TALLYMESSAGE xmlns:UDF="TallyUDF"><VOUCHER VCHTYPE="Sales" ACTION="Create">
      <DATE>${ymd(date)}</DATE><VOUCHERTYPENAME>Sales</VOUCHERTYPENAME><VOUCHERNUMBER>${esc(o.invoiceNo!)}</VOUCHERNUMBER>
      <PARTYLEDGERNAME>${party}</PARTYLEDGERNAME><NARRATION>${esc(o.number)} / DC ${esc(o.dcNo ?? "")} / ${esc(o.terms)}</NARRATION>
      <ALLLEDGERENTRIES.LIST><LEDGERNAME>${party}</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-${rs(t.total)}</AMOUNT></ALLLEDGERENTRIES.LIST>
      <ALLLEDGERENTRIES.LIST><LEDGERNAME>Sales</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${rs(t.sub)}</AMOUNT></ALLLEDGERENTRIES.LIST>
      ${tax}
    </VOUCHER></TALLYMESSAGE>`;
    });
    return file(envelope(v.join("\n")), "application/xml", "tally-sales.xml");
  }

  const rows = S.crmOrders.filter((o) => o.payment).map((o) => ({ o, d: dealer(o.dealerId), p: o.payment! }));
  if (csv) {
    const head = ["Date", "Order", "Invoice no", "Dealer", "Mode", "Reference", "Amount", "Reported to accounts"];
    const body = rows.map(({ o, d, p }) => [ymd(p.at), o.number, o.invoiceNo ?? "", d?.businessName ?? "", p.mode, p.utr, rs(p.amount), p.reported ? "Yes" : "No"]);
    return file([head, ...body].map((r) => r.map(csvCell).join(",")).join("\r\n"), "text/csv", "receipts.csv");
  }
  const v = rows.map(({ o, d, p }) => {
    const party = esc(d?.businessName ?? "Unknown dealer");
    return `<TALLYMESSAGE xmlns:UDF="TallyUDF"><VOUCHER VCHTYPE="Receipt" ACTION="Create">
      <DATE>${ymd(p.at)}</DATE><VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME><NARRATION>${esc(o.number)} / ${esc(p.mode)} ${esc(p.utr)}</NARRATION>
      <ALLLEDGERENTRIES.LIST><LEDGERNAME>${party}</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${rs(p.amount)}</AMOUNT>
        <BILLALLOCATIONS.LIST><NAME>${esc(o.invoiceNo ?? o.number)}</NAME><BILLTYPE>Agst Ref</BILLTYPE><AMOUNT>${rs(p.amount)}</AMOUNT></BILLALLOCATIONS.LIST></ALLLEDGERENTRIES.LIST>
      <ALLLEDGERENTRIES.LIST><LEDGERNAME>${p.mode === "Cheque" ? "Cheques in Hand" : "Bank Account"}</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-${rs(p.amount)}</AMOUNT></ALLLEDGERENTRIES.LIST>
    </VOUCHER></TALLYMESSAGE>`;
  });
  return file(envelope(v.join("\n")), "application/xml", "tally-receipts.xml");
}

function envelope(body: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA>
<REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC><REQUESTDATA>
${body}
</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;
}

function file(text: string, type: string, name: string) {
  return new Response(text, { headers: { "Content-Type": `${type}; charset=utf-8`, "Content-Disposition": `attachment; filename="${name}"` } });
}
