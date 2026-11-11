import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { PageTitle } from "@/components/ui";
import { StoreCard } from "@/components/store/store-card";
import { cardData } from "@/components/store/stock";
import { getCategory, getFilterOptions, listProducts } from "@/lib/data/catalog";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ u?: string; depth?: string; q?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategory(slug);
  if (!category) notFound();

  const u = sp.u ? Number(sp.u) : undefined;
  const depth = sp.depth ? Number(sp.depth) : undefined;
  const q = sp.q?.trim() || undefined;
  const [products, options] = await Promise.all([
    listProducts(slug, { u, depth, q }),
    getFilterOptions(slug),
  ]);

  const href = (next: { u?: number; depth?: number }) => {
    const p = new URLSearchParams();
    const nu = "u" in next ? next.u : u;
    const nd = "depth" in next ? next.depth : depth;
    if (nu) p.set("u", String(nu));
    if (nd) p.set("depth", String(nd));
    if (q) p.set("q", q);
    const s = p.toString();
    return `/category/${slug}${s ? `?${s}` : ""}`;
  };

  const chip = (active: boolean) =>
    clsx(
      "rounded-full border px-3 py-1 text-sm transition",
      active ? "border-accent bg-accent text-white" : "border-line bg-white hover:border-accent",
    );

  return (
    <>
      <PageTitle title={category.name} sub={`${products.length} products`} />
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="space-y-6">
          <form method="get" className="space-y-2">
            <div className="text-sm font-semibold">Product name</div>
            {u && <input type="hidden" name="u" value={u} />}
            {depth && <input type="hidden" name="depth" value={depth} />}
            <input
              name="q"
              defaultValue={q}
              placeholder="e.g. 42U"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <button className="w-full rounded-lg border border-line bg-white py-1.5 text-sm font-semibold hover:bg-slate-50">Filter</button>
          </form>
          {options.us.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-semibold">Height (U)</div>
              <div className="flex flex-wrap gap-2">
                <Link href={href({ u: undefined })} className={chip(!u)}>All</Link>
                {options.us.map((x) => (
                  <Link key={x} href={href({ u: x })} className={chip(u === x)}>{x}U</Link>
                ))}
              </div>
            </div>
          )}
          {options.depths.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-semibold">Depth (mm)</div>
              <div className="flex flex-wrap gap-2">
                <Link href={href({ depth: undefined })} className={chip(!depth)}>All</Link>
                {options.depths.map((x) => (
                  <Link key={x} href={href({ depth: x })} className={chip(depth === x)}>{x}</Link>
                ))}
              </div>
            </div>
          )}
        </aside>
        <div>
          {products.length === 0 ? (
            <p className="text-muted">No products match these filters.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {products.map((p) => (
                <StoreCard key={p.id} d={cardData(p)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
