import Link from "next/link";
import clsx from "clsx";
import { PageTitle } from "@/components/ui";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getCategories } from "@/lib/data/catalog";
import { BulkOrderForm } from "./bulk-form";

export default async function DealerCatalog({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  await requireUser("DEALER");
  const { cat = "network" } = await searchParams;
  const categories = await getCategories();

  const variants = await db.variant.findMany({
    where: { product: { category: { slug: cat } } },
    orderBy: [{ product: { uHeight: "asc" } }, { depthMm: "asc" }],
    include: { product: true, stock: true },
  });

  const rows = variants.map((v) => ({
    id: v.id,
    name: v.product.name,
    label: v.label,
    sku: v.sku,
    retail: v.retailPrice,
    dealer: v.dealerPrice,
    stock: v.stock.reduce((n, s) => n + s.qty, 0),
  }));

  return (
    <>
      <PageTitle title="Dealer price list & bulk order" sub="Enter quantities and place the order against your credit." />
      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/catalog?cat=${c.slug}`}
            className={clsx(
              "rounded-full border px-3 py-1 text-sm",
              c.slug === cat ? "border-accent bg-accent text-white" : "border-line bg-white hover:border-accent",
            )}
          >
            {c.name}
          </Link>
        ))}
      </div>
      <BulkOrderForm rows={rows} />
    </>
  );
}
