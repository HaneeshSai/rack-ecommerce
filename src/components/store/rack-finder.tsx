"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Card, inputCls } from "@/components/ui";
import { inr } from "@/lib/money";

type P = { slug: string; name: string; kind: string; u: number; variants: { id: string; label: string; depth: number | null; retail: number; stock: number }[] };

const ITEMS = [
  { k: "switch", label: "Network or PoE switches", u: 1 },
  { k: "panel", label: "Patch panels", u: 1 },
  { k: "dvr", label: "DVR / NVR", u: 2 },
  { k: "s1", label: "Servers (1U)", u: 1 },
  { k: "s2", label: "Servers (2U)", u: 2 },
  { k: "ups", label: "Rack UPS", u: 2 },
  { k: "misc", label: "Cable organisers, power strips, trays", u: 1 },
];
const DEPTHS = [
  { v: 300, label: "Small: switches, patch panels (up to 300 mm)" },
  { v: 450, label: "Medium: DVR / NVR, UPS (up to 450 mm)" },
  { v: 600, label: "Deep: standard servers (up to 600 mm)" },
  { v: 800, label: "Extra deep: large servers (up to 800 mm)" },
];

export function RackFinder({ products }: { products: P[] }) {
  const [qty, setQty] = useState<Record<string, number>>({ switch: 1, panel: 1 });
  const [depth, setDepth] = useState(300);
  const [mount, setMount] = useState<"wall" | "floor">("wall");
  const [buffer, setBuffer] = useState(25);

  const used = ITEMS.reduce((n, i) => n + (qty[i.k] || 0) * i.u, 0);
  const need = used === 0 ? 0 : Math.max(2, Math.ceil(used * (1 + buffer / 100)));
  const minDepth = depth + 100; // room for cables behind the equipment

  const result = useMemo(() => {
    if (!need) return null;
    const wallKinds = ["MINI", "WALL_MOUNT"], floorKinds = ["NETWORK_RACK", "SERVER_RACK", "OPEN_RACK"];
    const wallOk = mount === "wall" && need <= 15;
    const kinds = wallOk ? wallKinds : floorKinds;
    const options = products
      .filter((p) => kinds.includes(p.kind) && p.u >= need)
      .flatMap((p) => p.variants.filter((v) => (v.depth ?? 0) >= minDepth).map((v) => ({ p, v })))
      .sort((a, b) => a.p.u - b.p.u || (a.v.depth ?? 0) - (b.v.depth ?? 0) || a.v.retail - b.v.retail);
    return { options: options.slice(0, 4), switched: mount === "wall" && !wallOk };
  }, [products, need, minDepth, mount]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card className="space-y-5 p-5 text-sm">
        <div>
          <div className="mb-2 font-semibold">1. What goes in the rack?</div>
          <div className="space-y-2">
            {ITEMS.map((i) => (
              <label key={i.k} className="flex items-center justify-between gap-3">
                <span>{i.label} <span className="text-muted">({i.u}U each)</span></span>
                <input type="number" min={0} max={20} className={inputCls + " !w-20"} value={qty[i.k] ?? 0} onChange={(e) => setQty({ ...qty, [i.k]: Math.max(0, Number(e.target.value)) })} />
              </label>
            ))}
          </div>
        </div>
        <label className="block"><span className="mb-1 block font-semibold">2. Deepest equipment</span>
          <select className={inputCls} value={depth} onChange={(e) => setDepth(Number(e.target.value))}>{DEPTHS.map((d) => <option key={d.v} value={d.v}>{d.label}</option>)}</select></label>
        <div>
          <div className="mb-1 font-semibold">3. Where will it go?</div>
          <div className="flex gap-2">
            {(["wall", "floor"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMount(m)} className={`flex-1 rounded-lg border px-3 py-2 ${mount === m ? "border-accent bg-accent-soft font-semibold" : "border-line bg-white"}`}>{m === "wall" ? "On a wall" : "On the floor"}</button>
            ))}
          </div>
        </div>
        <label className="block"><span className="mb-1 block font-semibold">4. Spare room to grow</span>
          <select className={inputCls} value={buffer} onChange={(e) => setBuffer(Number(e.target.value))}>
            <option value={0}>None</option><option value={25}>25% (recommended)</option><option value={50}>50%</option>
          </select></label>
      </Card>

      <div className="space-y-4">
        {!need && <Card className="p-6 text-sm text-muted">Add at least one item to see a recommendation.</Card>}
        {need > 0 && result && (
          <>
            <Card className="p-5 text-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">You need</div>
              <div className="text-3xl font-extrabold">{need}U <span className="text-base font-medium text-muted">and at least {minDepth} mm deep</span></div>
              <p className="mt-1 text-muted">{used}U of equipment{buffer ? ` + ${buffer}% spare` : ""}. Depth includes 100 mm behind for cables.</p>
              {result.switched && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-amber-900">Wall mount racks go up to 15U, so we are showing floor-standing racks instead.</p>}
            </Card>
            {result.options.length === 0 && <Card className="p-5 text-sm">No standard rack fits. Please <Link href="/request-quote" className="font-semibold text-accent underline">request a custom quote</Link>.</Card>}
            {result.options.map(({ p, v }, idx) => (
              <Card key={v.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 font-bold">{p.name} {idx === 0 && <Badge tone="green">Best fit</Badge>}</div>
                  <div className="text-muted">{v.label}{v.depth ? ` · ${v.depth} mm deep` : ""} · {p.u - need} spare U</div>
                  <div className="text-xs text-muted">{v.stock > 0 ? (v.stock <= 5 ? `Only ${v.stock} left` : "In stock") : "Out of stock, ships in a few days"}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold">{inr(v.retail)}</div>
                  <Link href={`/product/${p.slug}`} className="text-xs font-semibold text-accent hover:underline">View and buy &rarr;</Link>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
