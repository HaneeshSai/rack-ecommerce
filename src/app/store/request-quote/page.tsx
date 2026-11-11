import { PageTitle } from "@/components/ui";
import { QuoteForm } from "@/components/store/forms";
import { db } from "@/lib/db";

export default async function RequestQuotePage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams;
  const all = await db.product.findMany({});
  return (
    <>
      <PageTitle title="Request a quote" sub="Large or custom order? Tell us what you need and our sales team will send pricing." />
      <QuoteForm products={all.map((p) => ({ slug: p.slug, name: p.name }))} defaultProduct={product} />
    </>
  );
}
