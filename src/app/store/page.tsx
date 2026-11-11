import Link from "next/link";
import { LinkButton } from "@/components/ui";
import { StoreCard } from "@/components/store/store-card";
import { cardData } from "@/components/store/stock";
import { RackArt } from "@/components/rack-art";
import { PortalLink } from "@/components/portal-switcher";
import { featuredProducts, getCategories } from "@/lib/data/catalog";
import { BRAND } from "@/lib/brand";

const CAT_BLURB: Record<string, string> = {
  "wall-mount": "Compact 2U-15U cabinets for offices and CCTV rooms.",
  network: "17U-42U floor racks for switches and patch panels.",
  server: "Deep, ventilated racks for servers and storage.",
  open: "Open-frame racks with easy front and rear access.",
  accessories: "Power, cooling, cabling and CCTV essentials.",
  fabrication: "Custom brackets, boxes and trays, made in-house.",
};

const BENEFITS = [
  ["GST invoice", "A proper tax invoice with every order, emailed instantly."],
  ["3 warehouses", "Hyderabad, Vijayawada and Tirupati stock, shipped from the nearest."],
  ["Dealer pricing", "Registered dealers get their own price list and credit terms."],
  ["Made to order", "Need a custom size? We fabricate racks and brackets in-house."],
];

export default async function Home() {
  const [categories, featured] = await Promise.all([
    getCategories(),
    featuredProducts(["NETWORK_RACK", "SERVER_RACK", "WALL_MOUNT", "OPEN_RACK"], 4),
  ]);
  return (
    <div className="space-y-16">
      <section className="hero-grid relative overflow-hidden rounded-3xl bg-linear-to-br from-brand via-brand to-brand-2 px-6 py-12 text-white shadow-[var(--shadow-lg)] md:px-12 md:py-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative grid items-center gap-10 md:grid-cols-[1.3fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent ring-1 ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Retail + Dealer
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl">
              Racks that keep your <span className="text-accent">network</span> in order.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-300">
              {BRAND.tagline}. Wall mount, network and server racks in every size, dispatched from 3 warehouses with GST invoices.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/category/network" className="!px-6 !py-3">Shop network racks</LinkButton>
              <LinkButton href="/category/wall-mount" variant="ghost" className="!px-6 !py-3 !border-white/20 !bg-white/10 !text-white hover:!bg-white/20">
                Wall mount racks
              </LinkButton>
            </div>
            <dl className="mt-10 flex gap-8 text-sm">
              {[["20+", "Rack sizes"], ["3", "Warehouses"], ["GST", "Invoice on every order"]].map(([k, v]) => (
                <div key={v}>
                  <dt className="text-2xl font-extrabold">{k}</dt>
                  <dd className="text-slate-400">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="hidden justify-center md:flex">
            <RackArt units={14} dark className="h-[22rem] drop-shadow-[0_20px_40px_rgb(0_0_0/0.45)]" />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight">Shop by category</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="group">
              <div className="flex h-full items-center justify-between gap-4 rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow)] transition group-hover:-translate-y-0.5 group-hover:border-accent/60 group-hover:shadow-[var(--shadow-lg)]">
                <div>
                  <div className="font-bold">{c.name}</div>
                  <p className="mt-1 text-sm text-muted">{CAT_BLURB[c.slug] ?? ""}</p>
                  <div className="mt-3 text-xs font-semibold text-accent">{c._count.products} products &rarr;</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight">Popular racks</h2>
          <Link href="/category/network" className="text-sm font-semibold text-accent hover:underline">View all &rarr;</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {featured.map((p) => (
            <StoreCard key={p.id} d={cardData(p)} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map(([t, d], i) => (
          <div key={t} className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow)]">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-sm font-extrabold text-accent">
              {i + 1}
            </div>
            <div className="font-bold">{t}</div>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-brand p-8 text-white">
        <div>
          <h2 className="text-xl font-extrabold">Need 10+ racks or a custom size?</h2>
          <p className="mt-1 text-slate-300">Request a quote for bulk orders and our sales team will reply within 1 business day.</p>
        </div>
        <LinkButton href="/request-quote" className="!px-6 !py-3">Request a quote</LinkButton>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-accent-soft p-8 ring-1 ring-accent/20">
        <div>
          <h2 className="text-xl font-extrabold">Are you a dealer or installer?</h2>
          <p className="mt-1 text-muted">Get trade pricing by tier, bulk ordering, freight options and credit terms.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/dealer-registration" className="!px-5 !py-3">Apply for a dealer account</LinkButton>
          <PortalLink
            to="dealers"
            className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-2"
          >
            Dealer sign in &rarr;
          </PortalLink>
        </div>
      </section>
    </div>
  );
}
