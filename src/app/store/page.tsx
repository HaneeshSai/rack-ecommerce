import Link from "next/link";
import { Card, LinkButton } from "@/components/ui";
import { ProductCard } from "@/components/product-card";
import { featuredProducts, getCategories } from "@/lib/data/catalog";
import { BRAND } from "@/lib/brand";

export default async function Home() {
  const [categories, featured] = await Promise.all([
    getCategories(),
    featuredProducts(["NETWORK_RACK", "SERVER_RACK", "WALL_MOUNT", "OPEN_RACK"], 4),
  ]);
  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-brand px-8 py-14 text-white">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent">Retail + Dealer</p>
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight md:text-5xl">
          Racks and accessories, dispatched from 3 warehouses.
        </h1>
        <p className="mt-4 max-w-xl text-slate-300">
          {BRAND.tagline}. Wall mount, network and server racks in every size, with GST invoices.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <LinkButton href="/category/network">Shop network racks</LinkButton>
          <LinkButton href="/category/wall-mount" variant="ghost">Wall mount racks</LinkButton>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Shop by category</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {categories.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`}>
              <Card className="p-5 transition hover:border-accent hover:shadow-md">
                <div className="font-semibold">{c.name}</div>
                <div className="mt-1 text-sm text-muted">{c._count.products} products</div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Popular racks</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} href={`/product/${p.slug}`} name={p.name} uHeight={p.uHeight} variants={p.variants} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["GST invoice", "Proper tax invoice with every order, emailed instantly."],
          ["3 warehouses", "Hyderabad, Vijayawada and Tirupati stock, shipped from the nearest."],
          ["Dealer pricing", "Registered dealers get their own price list and credit terms."],
        ].map(([t, d]) => (
          <Card key={t} className="p-5">
            <div className="font-semibold">{t}</div>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
