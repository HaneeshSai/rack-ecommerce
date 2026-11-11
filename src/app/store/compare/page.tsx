import { Suspense } from "react";
import { PageTitle } from "@/components/ui";
import { db } from "@/lib/db";
import { SHIPPING_CLASS_LABEL } from "@/lib/logistics";
import { CompareView, type CompareProduct } from "./compare-view";

export default async function ComparePage() {
  const all = await db.product.findMany({});
  const products: CompareProduct[] = all.map((p) => {
    const v = p.variants[0];
    return {
      slug: p.slug,
      name: p.name,
      category: p.category.name,
      uHeight: p.uHeight,
      variantCount: p.variants.length,
      depthMm: v.depthMm,
      widthMm: v.widthMm,
      heightMm: v.heightMm,
      weightKg: v.weightKg,
      shippingClass: SHIPPING_CLASS_LABEL[v.shippingClass],
      sourcing: p.sourcing === "MANUFACTURED" ? "Made in-house" : "Sourced",
      retail: v.retailPrice,
      dealer: v.dealerPrice,
    };
  });
  return (
    <>
      <PageTitle title="Compare products" sub="Specs shown for each product's lowest-priced variant." />
      <Suspense fallback={<p className="text-muted">Loading...</p>}>
        <CompareView products={products} />
      </Suspense>
    </>
  );
}
