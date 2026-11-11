import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { PageTitle } from "@/components/ui";
import { ProductCard } from "@/components/product-card";
import { getCategory, getFilterOptions, listProducts } from "@/lib/data/catalog";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ u?: string; depth?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategory(slug);
  if (!category) notFound();

  const u = sp.u ? Number(sp.u) : undefined;
  const depth = sp.depth ? Number(sp.depth) : undefined;
  const [products, options] = await Promise.all([
    listProducts(slug, { u, depth }),
    getFilterOptions(slug),
  ]);

  const href = (next: { u?: number; depth?: number }) => {
    const q = new URLSearchParams();
    const nu = "u" in next ? next.u : u;
    const nd = "depth" in next ? next.depth : depth;
    if (nu) q.set("u", String(nu));
    if (nd) q.set("depth", String(nd));
    const s = q.toString();
    return `/category/${slug}${s ? `?${s}` : ""}`;
  };

  const chip = (active: boolean) =>
    clsx(
      "rounded-full border px-3 py-1 text-sm",
      active ? "border-accent bg-accent text-white" : "border-line bg-white hover:border-accent",
    );

  return (
    <>
      <PageTitle title={category.name} sub={`${products.length} products`} />
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="space-y-6">
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
                <ProductCard key={p.id} href={`/product/${p.slug}`} name={p.name} uHeight={p.uHeight} variants={p.variants} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
