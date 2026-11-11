import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ProductKind, Sourcing } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const rupees = (n: number) => Math.round(n) * 100; // store paise

// ---- Rack data, transcribed from the client brief -------------------------
// [depth, width, height, flag?]
type Row = [number, number | null, number, string?];
type Series = {
  kind: ProductKind;
  cat: string;
  u: number;
  name: string;
  rows: Row[];
};

const series: Series[] = [
  // wall mount
  { kind: "MINI", cat: "wall-mount", u: 2, name: "2U Mini Wall Mount Rack", rows: [[320, 370, 145]] },
  { kind: "MINI", cat: "wall-mount", u: 4, name: "4U Mini Wall Mount Rack", rows: [[320, 370, 215]] },
  { kind: "WALL_MOUNT", cat: "wall-mount", u: 2, name: "2U Wall Mount Rack", rows: [[350, 500, 180], [450, 500, 180], [500, 500, 180], [600, 550, 180]] },
  {
    kind: "WALL_MOUNT", cat: "wall-mount", u: 4, name: "4U Wall Mount Rack",
    rows: [[350, 500, 245], [450, 500, 245], [500, 500, 245], [600, 550, 350, "Brief lists height 350 for 600mm depth; other 4U depths are 245. Confirm with client."]],
  },
  { kind: "WALL_MOUNT", cat: "wall-mount", u: 6, name: "6U Wall Mount Rack", rows: [[500, 500, 400], [600, 550, 450]] },
  { kind: "WALL_MOUNT", cat: "wall-mount", u: 9, name: "9U Wall Mount Rack", rows: [[450, 500, 500], [500, 500, 500], [600, 550, 550]] },
  { kind: "WALL_MOUNT", cat: "wall-mount", u: 12, name: "12U Wall Mount Rack", rows: [[450, 500, 600], [500, 500, 600], [600, 550, 650]] },
  { kind: "WALL_MOUNT", cat: "wall-mount", u: 15, name: "15U Wall Mount Rack", rows: [[450, 500, 700], [500, 500, 700], [600, 550, 750]] },
  // floor network
  { kind: "NETWORK_RACK", cat: "network", u: 17, name: "17U Network Rack", rows: [[600, 600, 875]] },
  { kind: "NETWORK_RACK", cat: "network", u: 22, name: "22U Network Rack", rows: [[600, 600, 1095]] },
  {
    kind: "NETWORK_RACK", cat: "network", u: 27, name: "27U Network Rack",
    rows: [[600, 600, 1325, "Brief lists this as a second '22U' row at 1325mm height. Assumed 27U. Confirm with client."]],
  },
  { kind: "NETWORK_RACK", cat: "network", u: 32, name: "32U Network Rack", rows: [[600, 600, 1540]] },
  { kind: "NETWORK_RACK", cat: "network", u: 37, name: "37U Network Rack", rows: [[600, 600, 1800]] },
  { kind: "NETWORK_RACK", cat: "network", u: 42, name: "42U Network Rack", rows: [[600, 600, 1980]] },
  {
    kind: "OPEN_RACK", cat: "open", u: 45, name: "45U Open Rack",
    rows: [[525, null, 2145, "Brief lists width as '82', which is not a plausible mm value. Confirm with client."]],
  },
  // server
  { kind: "SERVER_RACK", cat: "server", u: 17, name: "17U Server Rack", rows: [[600, 600, 875], [1000, 600, 875]] },
  { kind: "SERVER_RACK", cat: "server", u: 24, name: "24U Server Rack", rows: [[600, 600, 1180], [800, 600, 1180]] },
  { kind: "SERVER_RACK", cat: "server", u: 27, name: "27U Server Rack", rows: [[600, 600, 1310], [1000, 600, 1310]] },
  { kind: "SERVER_RACK", cat: "server", u: 37, name: "37U Server Rack", rows: [[800, 600, 1755], [1000, 600, 1755]] },
  { kind: "SERVER_RACK", cat: "server", u: 42, name: "42U Server Rack", rows: [[800, 600, 1970], [1000, 600, 1970], [1000, 800, 1970]] },
];

const categories = [
  { slug: "wall-mount", name: "Wall Mount Racks", sort: 1 },
  { slug: "network", name: "Network Racks", sort: 2 },
  { slug: "server", name: "Server Racks", sort: 3 },
  { slug: "open", name: "Open Racks", sort: 4 },
  { slug: "accessories", name: "Rack & CCTV Accessories", sort: 5 },
  { slug: "fabrication", name: "Fabricated Brackets & Boxes", sort: 6 },
];

const sourced = [
  "Power Strips", "Cable Organisers", "Cooling Fans", "PVC Junction Box", "BNC Connectors",
  "DC Pins", "CCTV Cables", "CCTV SMPS", "Rack Mount UPS", "PoE Switches", "Patch Panels",
  "HDMI Splitters", "HDMI Extenders", "Cage Nuts & Bolts",
];
const manufactured = [
  "Perforated Fixed Rack Trays", "Metal Junction Box", "Pole Mounting Brackets",
  "L-Shaped Corner Mounting Brackets", "Wall Mount Brackets for PoE Switches", "Corner Mounts",
  "Adjustable Camera Stands", "CCTV Pole Boxes", "DVR/NVR Lock Boxes",
];

const slugify = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Deterministic pseudo-random so reseeding gives the same stock.
let seedN = 7;
const rand = () => ((seedN = (seedN * 9301 + 49297) % 233280) / 233280);

// SAMPLE PRICES ONLY - formula-based placeholders, not the client's price list.
const samplePrice = (u: number, depth: number, wall: boolean) =>
  rupees((wall ? 1400 : 4200) + u * (wall ? 240 : 410) + depth * 2.2);

async function main() {
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.stock.deleteMany();
  await db.variant.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.warehouse.deleteMany();
  await db.user.deleteMany();
  await db.dealer.deleteMany();
  await db.lead.deleteMany();

  const cats: Record<string, string> = {};
  for (const c of categories) cats[c.slug] = (await db.category.create({ data: c })).id;

  const warehouses = await Promise.all(
    [
      { code: "HYD", name: "Hyderabad Warehouse", city: "Hyderabad" },
      { code: "VJA", name: "Vijayawada Warehouse", city: "Vijayawada" },
      { code: "TPT", name: "Tirupati Warehouse", city: "Tirupati" },
    ].map((w) => db.warehouse.create({ data: w })),
  );

  const addStock = async (variantId: string) => {
    await db.stock.createMany({
      data: warehouses.map((w, i) => ({
        variantId,
        warehouseId: w.id,
        qty: i === 0 ? Math.floor(rand() * 40) : Math.floor(rand() * 18),
      })),
    });
  };

  for (const s of series) {
    const wall = s.kind === "WALL_MOUNT" || s.kind === "MINI";
    const product = await db.product.create({
      data: {
        slug: slugify(s.name),
        name: s.name,
        kind: s.kind,
        uHeight: s.u,
        hsn: "9403",
        gstRate: 18,
        sourcing: "MANUFACTURED",
        categoryId: cats[s.cat],
        description: `${s.name} for network, CCTV and server equipment. Standard 19-inch mounting.`,
      },
    });
    for (const [depth, width, height, flag] of s.rows) {
      const retail = samplePrice(s.u, depth, wall);
      const v = await db.variant.create({
        data: {
          sku: `${s.cat.slice(0, 2).toUpperCase()}${s.u}U-${depth}`,
          productId: product.id,
          depthMm: depth,
          widthMm: width,
          heightMm: height,
          label: `${depth}mm depth`,
          retailPrice: retail,
          dealerPrice: Math.round((retail * 0.82) / 100) * 100,
          needsConfirmation: !!flag,
          confirmNote: flag ?? null,
        },
      });
      await addStock(v.id);
    }
  }

  const addAccessories = async (names: string[], cat: string, sourcing: Sourcing, base: number) => {
    for (const [i, name] of names.entries()) {
      const p = await db.product.create({
        data: {
          slug: slugify(name),
          name,
          kind: "ACCESSORY",
          sourcing,
          hsn: sourcing === "SOURCED" ? "8536" : "7326",
          gstRate: 18,
          categoryId: cats[cat],
          description: `${name}. Compatible with standard racks and CCTV installations.`,
        },
      });
      const retail = rupees(base + i * 135);
      const v = await db.variant.create({
        data: {
          sku: `${cat.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
          productId: p.id,
          label: "Standard",
          retailPrice: retail,
          dealerPrice: Math.round((retail * 0.85) / 100) * 100,
        },
      });
      await addStock(v.id);
    }
  };
  await addAccessories(sourced, "accessories", "SOURCED", 180);
  await addAccessories(manufactured, "fabrication", "MANUFACTURED", 320);

  // ---- Sample users / dealers / leads / orders ------------------------------
  const dealers = await Promise.all([
    db.dealer.create({ data: { businessName: "Sri Sai Networks", gstin: "37AAAAA0000A1Z5", gstVerified: true, contactName: "Ravi Kumar", phone: "9000000001", city: "Guntur", creditLimit: rupees(200000), creditUsed: rupees(46000) } }),
    db.dealer.create({ data: { businessName: "Vision CCTV Solutions", gstin: "36BBBBB1111B1Z6", gstVerified: true, contactName: "Anil Reddy", phone: "9000000002", city: "Hyderabad", creditLimit: rupees(150000), creditUsed: rupees(0) } }),
    db.dealer.create({ data: { businessName: "Tirumala Electronics", gstin: "37CCCCC2222C1Z7", gstVerified: false, contactName: "Lakshmi", phone: "9000000003", city: "Tirupati", creditLimit: 0, creditUsed: 0 } }),
  ]);

  await db.user.createMany({
    data: [
      { email: "admin@demo.test", name: "Admin", role: "ADMIN" },
      { email: "customer@demo.test", name: "Demo Customer", role: "CUSTOMER" },
      { email: "dealer@demo.test", name: "Ravi Kumar", role: "DEALER", dealerId: dealers[0].id },
    ],
  });

  await db.lead.createMany({
    data: [
      { name: "Suresh", company: "Metro Hospital", phone: "9000000011", interest: "6x 42U server racks", status: "QUOTED", source: "website" },
      { name: "Priya", company: "BrightSchool", phone: "9000000012", interest: "CCTV junction boxes bulk", status: "NEW", source: "whatsapp" },
      { name: "Imran", company: null, phone: "9000000013", interest: "Custom 12U wall rack", status: "CONTACTED", source: "website" },
      { name: "Kiran", company: "Kiran Telecom", phone: "9000000014", interest: "Dealer registration", status: "WON", source: "referral" },
    ],
  });

  const some = await db.variant.findMany({ take: 3, orderBy: { sku: "asc" } });
  for (const [i, v] of some.entries()) {
    const unit = v.dealerPrice;
    const sub = unit * 2;
    const gst = Math.round(sub * 0.18);
    await db.order.create({
      data: {
        number: `RK-1000${i + 1}`,
        status: (["PAID", "PACKED", "DISPATCHED"] as const)[i],
        dealerId: dealers[0].id,
        customerName: dealers[0].businessName,
        customerPhone: dealers[0].phone,
        customerGstin: dealers[0].gstin,
        shipState: "Andhra Pradesh",
        subtotal: sub, gstAmount: gst, total: sub + gst,
        items: { create: [{ variantId: v.id, qty: 2, unitPrice: unit, gstRate: 18 }] },
      },
    });
  }

  console.log("Seeded:", await db.product.count(), "products,", await db.variant.count(), "variants");
}

main().finally(() => db.$disconnect());
