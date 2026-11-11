import { db } from "@/lib/db";
import type { ProductKind } from "@/generated/prisma/client";

export type CatalogFilter = {
  u?: number;
  depth?: number;
  q?: string;
};

export async function getCategories() {
  return db.category.findMany({
    orderBy: { sort: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function getCategory(slug: string) {
  return db.category.findUnique({ where: { slug } });
}

export async function listProducts(categorySlug: string, f: CatalogFilter = {}) {
  return db.product.findMany({
    where: {
      category: { slug: categorySlug },
      ...(f.u ? { uHeight: f.u } : {}),
      ...(f.q ? { name: { contains: f.q, mode: "insensitive" as const } } : {}),
      ...(f.depth ? { variants: { some: { depthMm: f.depth } } } : {}),
    },
    orderBy: [{ uHeight: "asc" }, { name: "asc" }],
    include: { variants: { orderBy: { retailPrice: "asc" }, include: { stock: true } } },
  });
}

export async function getFilterOptions(categorySlug: string) {
  const products = await db.product.findMany({
    where: { category: { slug: categorySlug } },
    select: { uHeight: true, variants: { select: { depthMm: true } } },
  });
  const us = new Set<number>();
  const depths = new Set<number>();
  for (const p of products) {
    if (p.uHeight) us.add(p.uHeight);
    for (const v of p.variants) if (v.depthMm) depths.add(v.depthMm);
  }
  const asc = (a: number, b: number) => a - b;
  return { us: [...us].sort(asc), depths: [...depths].sort(asc) };
}

export async function getProduct(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      variants: {
        orderBy: { retailPrice: "asc" },
        include: { stock: { include: { warehouse: true } } },
      },
    },
  });
}

export async function featuredProducts(kind: ProductKind[], take = 4) {
  return db.product.findMany({
    where: { kind: { in: kind } },
    take,
    orderBy: { uHeight: "asc" },
    include: { variants: { orderBy: { retailPrice: "asc" } } },
  });
}

export async function getVariantsByIds(ids: string[]) {
  return db.variant.findMany({
    where: { id: { in: ids } },
    include: { product: true, stock: { include: { warehouse: true } } },
  });
}
