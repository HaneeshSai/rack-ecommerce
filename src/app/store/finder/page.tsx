import { PageTitle } from "@/components/ui";
import { db } from "@/lib/db";
import { RackFinder } from "@/components/store/rack-finder";

export default async function Finder() {
  const products = (await db.product.findMany({ where: { kind: { in: ["MINI", "WALL_MOUNT", "NETWORK_RACK", "SERVER_RACK", "OPEN_RACK"] } } })).map((p) => ({
    slug: p.slug, name: p.name, kind: p.kind, u: p.uHeight ?? 0,
    variants: p.variants.map((v) => ({
      id: v.id, label: v.label || "Standard", depth: v.depthMm, retail: v.retailPrice, stock: v.stock.reduce((n, s) => n + s.qty, 0),
    })),
  }));
  return (
    <>
      <PageTitle title="Rack finder" sub="Tell us what goes in the rack. We suggest the right size, with room to grow." />
      <RackFinder products={products} />
    </>
  );
}
