import { notFound } from "next/navigation";
import { Card, LinkButton, PageTitle } from "@/components/ui";
import { ContactForm } from "@/components/store/forms";
import { BRAND } from "@/lib/brand";
import { mock } from "@/lib/db";
import { WAREHOUSES } from "@/lib/logistics";

type Section = { h: string; p: string };
const TEXT: Record<string, { title: string; sub: string; sections: Section[] }> = {
  about: {
    title: `About ${BRAND.name}`,
    sub: BRAND.tagline,
    sections: [
      { h: "Who we are", p: "An established distributor of wall-mount, network and server racks and CCTV accessories, supplying retail buyers and a verified network of 100+ dealers across Telangana and Andhra Pradesh." },
      { h: "Made and sourced", p: "Racks, trays, brackets and boxes are fabricated in-house. Power strips, UPS units, cables and connectors are sourced from trusted brands. Everything ships from the hub nearest you." },
      { h: "Built for installers", p: "Dealers get trade pricing by tier, bulk ordering, proforma invoices, credit terms and GST invoices with every order." },
    ],
  },
  "shipping-returns": {
    title: "Shipping & returns",
    sub: "How your order reaches you and what to do if something is wrong.",
    sections: [
      { h: "Shipped fully assembled", p: "Racks are bulky, so they travel by three-wheeler or Tata Ace (Porter) rather than courier. Freight is priced by vehicle size and distance from the dispatching warehouse." },
      { h: "Dealer freight options", p: "Choose prepaid freight (added to the tax invoice, we book the vehicle) or self-booked freight at Rs 0 (you book your own Porter or pay the driver on delivery)." },
      { h: "Store pickup", p: "Retail buyers can collect from any of our three warehouses at no freight charge." },
      { h: "Damage and returns", p: "Raise a return or damage claim from your order within 48 hours of delivery with photos. Approved returns are credited with a credit note." },
    ],
  },
  terms: {
    title: "Terms & conditions",
    sub: "Prototype placeholder text.",
    sections: [
      { h: "Pricing and tax", p: "Retail prices include GST. Dealer prices are quoted excluding GST and GST is added on the invoice. CGST + SGST or IGST applies based on the dispatching warehouse and delivery state." },
      { h: "Payment", p: "Online payment, bank transfer against a proforma invoice (approved dealers) and credit (approved dealers with a limit). Unpaid bank-transfer orders are released after the hold period." },
      { h: "Dealer accounts", p: "Dealer accounts are approved manually after GSTIN review. We may withdraw trade prices or credit at our discretion." },
    ],
  },
  privacy: {
    title: "Privacy policy",
    sub: "Prototype placeholder text.",
    sections: [
      { h: "What we collect", p: "Contact details, delivery addresses, GSTIN and order history, to fulfil orders and issue tax invoices." },
      { h: "How we use it", p: "To process orders, send order updates by email, WhatsApp or SMS, and handle support requests. We do not sell your data." },
      { h: "Your choices", p: "Contact us to correct or delete your account data, subject to tax record-keeping rules." },
    ],
  },
};

const SLUGS = [...Object.keys(TEXT), "contact", "warehouses"];

export default async function InfoPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  if (!SLUGS.includes(page)) notFound();

  if (page === "contact") {
    return (
      <>
        <PageTitle title="Contact us" sub="Sales, dealer enquiries and support." />
        <div className="grid gap-6 md:grid-cols-2">
          <ContactForm />
          <Card className="h-fit space-y-3 p-6 text-sm">
            <div><div className="text-xs font-semibold uppercase text-muted">Phone / WhatsApp</div><div className="font-semibold">{BRAND.supportPhone}</div></div>
            <div><div className="text-xs font-semibold uppercase text-muted">Hours</div><div>Mon-Sat, 9:30 am - 6:30 pm</div></div>
            <div><div className="text-xs font-semibold uppercase text-muted">Warehouses</div><div>Hyderabad - Vijayawada - Tirupati</div></div>
            <LinkButton href="/request-quote" variant="ghost">Request a bulk quote</LinkButton>
          </Card>
        </div>
      </>
    );
  }

  if (page === "warehouses") {
    const gstin = mock.S().settings.gstin;
    return (
      <>
        <PageTitle title="Warehouse locations" sub="Stock is held at three hubs. Each order ships from the nearest hub with stock." />
        <div className="grid gap-4 md:grid-cols-3">
          {WAREHOUSES.map((w) => (
            <Card key={w.code} className="space-y-1 p-5 text-sm">
              <div className="text-xs font-bold uppercase tracking-widest text-accent">{w.code}</div>
              <div className="text-lg font-extrabold">{w.city}</div>
              <div className="text-muted">{w.state}</div>
              <div className="pt-2 text-xs text-muted">GSTIN on invoices: {gstin[w.state] ?? "To be confirmed"}</div>
            </Card>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">
          Hyderabad is in Telangana; Vijayawada and Tirupati are in Andhra Pradesh. Whether the Andhra Pradesh hubs invoice under a separate GSTIN is still to be confirmed with the client.
        </p>
      </>
    );
  }

  const c = TEXT[page];
  return (
    <>
      <PageTitle title={c.title} sub={c.sub} />
      <div className="max-w-3xl space-y-4">
        {c.sections.map((s) => (
          <Card key={s.h} className="p-5">
            <h2 className="font-bold">{s.h}</h2>
            <p className="mt-1 text-sm text-muted">{s.p}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
