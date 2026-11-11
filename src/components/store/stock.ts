// Buyers never see exact quantities (spec): only In stock / Low stock / Ships in X days.
export type StockKind = "in" | "low" | "ships";

export const stockKind = (total: number): StockKind => (total <= 0 ? "ships" : total <= 5 ? "low" : "in");
export const STOCK_LABEL: Record<StockKind, string> = {
  in: "In stock",
  low: "Low stock",
  ships: "Ships in 3-5 days",
};
export const STOCK_TONE: Record<StockKind, "green" | "amber" | "blue"> = { in: "green", low: "amber", ships: "blue" };

type P = {
  slug: string;
  name: string;
  uHeight: number | null;
  variants: { retailPrice: number; dealerPrice: number; depthMm: number | null; stock?: { qty: number }[] }[];
};

export type CardData = {
  slug: string;
  name: string;
  uHeight: number | null;
  retail: number;
  dealer: number;
  depths: number[];
  stock: StockKind;
};

export function cardData(p: P): CardData {
  const total = p.variants.reduce((n, v) => n + (v.stock ?? []).reduce((m, s) => m + s.qty, 0), 0);
  return {
    slug: p.slug,
    name: p.name,
    uHeight: p.uHeight,
    retail: Math.min(...p.variants.map((v) => v.retailPrice)),
    dealer: Math.min(...p.variants.map((v) => v.dealerPrice)),
    depths: [...new Set(p.variants.map((v) => v.depthMm).filter((d): d is number => !!d))],
    stock: stockKind(total),
  };
}
