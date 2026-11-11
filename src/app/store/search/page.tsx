import Link from "next/link";
import { PageTitle } from "@/components/ui";
import { StoreCard } from "@/components/store/store-card";
import { SearchBox } from "@/components/store/search-box";
import { cardData } from "@/components/store/stock";
import { db } from "@/lib/db";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.trim();
  const products = term ? await db.product.findMany({ where: { name: { contains: term } } }) : [];
  return (
    <>
      <PageTitle title={term ? `Results for "${term}"` : "Search"} sub={term ? `${products.length} products` : "Search by product name, e.g. 42U, wall mount, patch panel"} />
      <SearchBox className="mb-6 max-w-md" defaultValue={term} />
      {term && products.length === 0 && (
        <p className="text-muted">
          Nothing matched. <Link href="/request-quote" className="font-semibold text-accent hover:underline">Request a quote</Link> and we will source it for you.
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <StoreCard key={p.id} d={cardData(p)} />
        ))}
      </div>
    </>
  );
}
