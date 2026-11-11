// FRONTEND-ONLY PROTOTYPE: there is no database. This file is an in-memory
// stand-in with seed data. State lives in the server process and resets on
// restart. Pages can use `db.*` (Prisma-like helpers) or read/write `mock.S()`
// directly (raw arrays) for the newer CRM / ops features.

import { DEFAULT_CITIES, DEFAULT_FREIGHT, type CityRule, type FreightTable, type ShippingClass, type Tier } from "@/lib/logistics";
import { gstBreakup, gstBreakupInclusive } from "@/lib/gst";

export type ProductKind = "WALL_MOUNT" | "MINI" | "NETWORK_RACK" | "SERVER_RACK" | "OPEN_RACK" | "ACCESSORY";
export type Role = "CUSTOMER" | "DEALER" | "ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS";
export type OrderStatus = "PLACED" | "PAYMENT_PENDING" | "CONFIRMED" | "PACKED" | "DISPATCHED" | "DELIVERED" | "CANCELLED" | "RETURNED";
export type LeadStatus = "NEW" | "CONTACTED" | "QUOTE_SENT" | "NEGOTIATION" | "WON" | "LOST";
export type DealerStatus = "PENDING" | "APPROVED" | "REJECTED";

export type Category = { id: string; slug: string; name: string; sort: number };
export type Product = {
  id: string; slug: string; name: string; description: string; kind: ProductKind;
  sourcing: "SOURCED" | "MANUFACTURED"; uHeight: number | null; hsn: string; gstRate: number; categoryId: string;
};
export type Variant = {
  id: string; sku: string; productId: string; depthMm: number | null; widthMm: number | null;
  heightMm: number | null; label: string; retailPrice: number; dealerPrice: number;
  needsConfirmation: boolean; confirmNote: string | null;
  weightKg: number; packedKg: number; boxSize: string; shippingClass: ShippingClass; moq: number;
};
export type Warehouse = { id: string; code: string; name: string; city: string };
export type StockRow = { variantId: string; warehouseId: string; qty: number };
export type Dealer = {
  id: string; businessName: string; gstin: string; gstVerified: boolean; contactName: string;
  phone: string; email: string; city: string; address: string;
  status: DealerStatus; tier: Tier; homeWarehouse: string; termsDays: number;
  creditLimit: number; creditUsed: number; assignedRep: string; appliedAt: Date;
  addresses: string[];
};
export type User = { id: string; email: string; name: string; role: Role; dealerId: string | null; warehouse: string | null };
export type OrderItem = { id: string; orderId: string; variantId: string; qty: number; unitPrice: number; gstRate: number };
export type Dispatch = { vehicleType: string; vehicleNo: string; driverPhone: string; bookingId: string };
export type TimelineEntry = { status: string; at: Date; by: string; note?: string };
export type Order = {
  id: string; number: string; status: OrderStatus; userId: string | null; dealerId: string | null;
  buyerType: "RETAIL" | "DEALER";
  customerName: string; customerPhone: string; customerGstin: string | null; shipState: string; city: string;
  subtotal: number; gstAmount: number; cgst: number; sgst: number; igst: number; shipping: number; total: number;
  paymentMode: string; // ONLINE | BANK TRANSFER | CREDIT (free text kept for old pages)
  delivery: "FREIGHT" | "SELF" | "PICKUP";
  warehouses: string[]; split: boolean;
  invoiceNo: string | null; proformaNo: string | null; utr: string | null; paid: boolean;
  holdUntil: Date | null; dueDate: Date | null;
  dispatch: Dispatch | null; ewayRequired: boolean; ewayBill: string | null; pod: boolean;
  timeline: TimelineEntry[]; createdAt: Date;
};
export type Lead = {
  id: string; name: string; company: string | null; phone: string; city: string; interest: string;
  status: LeadStatus; source: string; assignedTo: string; lostReason: string | null; dealerId: string | null; createdAt: Date;
};
export type QuoteItem = { variantId: string; qty: number; unitPrice: number; listPrice: number };
export type Quote = {
  id: string; number: string; dealerId: string | null; leadId: string | null; items: QuoteItem[];
  status: "DRAFT" | "PENDING_APPROVAL" | "SENT" | "ACCEPTED" | "EXPIRED"; discountPct: number; version: number;
  validUntil: Date; createdBy: string; createdAt: Date; orderNumber: string | null; note: string;
};
export type Ticket = {
  id: string; number: string; type: "DAMAGE" | "MISSING" | "WRONG" | "INSTALL" | "RETURN" | "OTHER";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED"; dealerId: string | null; orderNumber: string | null;
  subject: string; message: string; assignedTo: string; createdAt: Date;
};
export type Task = { id: string; title: string; due: Date; done: boolean; ref: string | null; owner: string; auto: boolean };
export type StockMovement = {
  id: string; variantId: string; warehouseId: string; delta: number;
  type: "ORDER" | "RECEIPT" | "TRANSFER_OUT" | "TRANSFER_IN" | "DAMAGE" | "ADJUSTMENT" | "PRODUCTION" | "RELEASE";
  reason: string; by: string; at: Date;
};
export type Transfer = {
  id: string; variantId: string; from: string; to: string; qty: number; status: "IN_TRANSIT" | "RECEIVED"; at: Date;
};
export type Activity = { id: string; who: string; action: string; at: Date };
export type Notification = {
  id: string; event: string; to: string; channels: string[]; text: string; ref: string | null; at: Date;
};
export type Settings = {
  holdDays: number; discountApprovalPct: number; splitDefault: "SPLIT" | "HOLD"; lowStock: number;
  blockOverdueCredit: boolean; inactiveDays: number;
  freight: FreightTable; cities: CityRule[];
  gstin: Record<string, string>; invoiceSeries: string; bank: string;
};

// ---- Seed data (from the client brief; prices are SAMPLE ONLY) ---------------
const rupees = (n: number) => Math.round(n) * 100; // paise
type Row = [number, number | null, number, string?];
type Series = { kind: ProductKind; cat: string; u: number; name: string; rows: Row[] };

const series: Series[] = [
  { kind: "MINI", cat: "wall-mount", u: 2, name: "2U Mini Wall Mount Rack", rows: [[320, 370, 145]] },
  { kind: "MINI", cat: "wall-mount", u: 4, name: "4U Mini Wall Mount Rack", rows: [[320, 370, 215]] },
  { kind: "WALL_MOUNT", cat: "wall-mount", u: 2, name: "2U Wall Mount Rack", rows: [[350, 500, 180], [450, 500, 180], [500, 500, 180], [600, 550, 180]] },
  { kind: "WALL_MOUNT", cat: "wall-mount", u: 4, name: "4U Wall Mount Rack", rows: [[350, 500, 245], [450, 500, 245], [500, 500, 245], [600, 550, 350, "Brief lists height 350 for 600mm depth; other 4U depths are 245. Confirm with client."]] },
  { kind: "WALL_MOUNT", cat: "wall-mount", u: 6, name: "6U Wall Mount Rack", rows: [[500, 500, 400], [600, 550, 450]] },
  { kind: "WALL_MOUNT", cat: "wall-mount", u: 9, name: "9U Wall Mount Rack", rows: [[450, 500, 500], [500, 500, 500], [600, 550, 550]] },
  { kind: "WALL_MOUNT", cat: "wall-mount", u: 12, name: "12U Wall Mount Rack", rows: [[450, 500, 600], [500, 500, 600], [600, 550, 650]] },
  { kind: "WALL_MOUNT", cat: "wall-mount", u: 15, name: "15U Wall Mount Rack", rows: [[450, 500, 700], [500, 500, 700], [600, 550, 750]] },
  { kind: "NETWORK_RACK", cat: "network", u: 17, name: "17U Network Rack", rows: [[600, 600, 875]] },
  { kind: "NETWORK_RACK", cat: "network", u: 22, name: "22U Network Rack", rows: [[600, 600, 1095]] },
  { kind: "NETWORK_RACK", cat: "network", u: 27, name: "27U Network Rack", rows: [[600, 600, 1325, "Brief lists this as a second '22U' row at 1325mm height. Assumed 27U. Confirm with client."]] },
  { kind: "NETWORK_RACK", cat: "network", u: 32, name: "32U Network Rack", rows: [[600, 600, 1540]] },
  { kind: "NETWORK_RACK", cat: "network", u: 37, name: "37U Network Rack", rows: [[600, 600, 1800]] },
  { kind: "NETWORK_RACK", cat: "network", u: 42, name: "42U Network Rack", rows: [[600, 600, 1980]] },
  { kind: "OPEN_RACK", cat: "open", u: 45, name: "45U Open Rack", rows: [[525, null, 2145, "Brief lists width as '82', which is not a plausible mm value. Confirm with client."]] },
  { kind: "SERVER_RACK", cat: "server", u: 17, name: "17U Server Rack", rows: [[600, 600, 875], [1000, 600, 875]] },
  { kind: "SERVER_RACK", cat: "server", u: 24, name: "24U Server Rack", rows: [[600, 600, 1180], [800, 600, 1180]] },
  { kind: "SERVER_RACK", cat: "server", u: 27, name: "27U Server Rack", rows: [[600, 600, 1310], [1000, 600, 1310]] },
  { kind: "SERVER_RACK", cat: "server", u: 37, name: "37U Server Rack", rows: [[800, 600, 1755], [1000, 600, 1755]] },
  { kind: "SERVER_RACK", cat: "server", u: 42, name: "42U Server Rack", rows: [[800, 600, 1970], [1000, 600, 1970], [1000, 800, 1970]] },
];

const sourced = ["Power Strips", "Cable Organisers", "Cooling Fans", "PVC Junction Box", "BNC Connectors", "DC Pins", "CCTV Cables", "CCTV SMPS", "Rack Mount UPS", "PoE Switches", "Patch Panels", "HDMI Splitters", "HDMI Extenders", "Cage Nuts & Bolts"];
const manufactured = ["Perforated Fixed Rack Trays", "Metal Junction Box", "Pole Mounting Brackets", "L-Shaped Corner Mounting Brackets", "Wall Mount Brackets for PoE Switches", "Corner Mounts", "Adjustable Camera Stands", "CCTV Pole Boxes", "DVR/NVR Lock Boxes"];

const slugify = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type State = {
  categories: Category[]; products: Product[]; variants: Variant[]; warehouses: Warehouse[];
  stock: StockRow[]; dealers: Dealer[]; users: User[]; orders: Order[]; items: OrderItem[]; leads: Lead[];
  quotes: Quote[]; tickets: Ticket[]; tasks: Task[]; movements: StockMovement[]; transfers: Transfer[];
  activity: Activity[]; notifications: Notification[]; settings: Settings;
  seq: number; invoiceSeq: number;
};

const DAY = 864e5;

function seed(): State {
  let n = 0;
  const id = (p: string) => `${p}${++n}`;
  let r = 7;
  const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const now = Date.now();
  const s: State = {
    categories: [], products: [], variants: [], warehouses: [], stock: [], dealers: [], users: [], orders: [], items: [],
    leads: [], quotes: [], tickets: [], tasks: [], movements: [], transfers: [], activity: [], notifications: [],
    settings: {
      holdDays: 3, discountApprovalPct: 10, splitDefault: "SPLIT", lowStock: 5, blockOverdueCredit: true, inactiveDays: 60,
      freight: structuredClone(DEFAULT_FREIGHT), cities: structuredClone(DEFAULT_CITIES),
      gstin: { Telangana: "36AABCR1234F1Z5", "Andhra Pradesh": "37AABCR1234F1Z3" },
      invoiceSeries: "RH/25-26/",
      bank: "RackHub Distribution - A/C 5010 0123 4567 - HDFC Bank, Banjara Hills - IFSC HDFC0000123",
    },
    seq: 0, invoiceSeq: 0,
  };

  const cats: Record<string, string> = {};
  for (const [i, [slug, name]] of ([
    ["wall-mount", "Wall Mount Racks"], ["network", "Network Racks"], ["server", "Server Racks"],
    ["open", "Open Racks"], ["accessories", "Rack & CCTV Accessories"], ["fabrication", "Fabricated Brackets & Boxes"],
  ] as const).entries()) {
    const c = { id: id("c"), slug, name, sort: i + 1 };
    s.categories.push(c);
    cats[slug] = c.id;
  }
  s.warehouses = [
    { id: id("w"), code: "HYD", name: "Hyderabad Warehouse", city: "Hyderabad" },
    { id: id("w"), code: "VJA", name: "Vijayawada Warehouse", city: "Vijayawada" },
    { id: id("w"), code: "TPT", name: "Tirupati Warehouse", city: "Tirupati" },
  ];
  const addStock = (variantId: string) => {
    for (const [i, w] of s.warehouses.entries()) {
      s.stock.push({
        variantId, warehouseId: w.id,
        qty: rand() < 0.12 ? Math.floor(rand() * 4) : i === 0 ? 12 + Math.floor(rand() * 40) : 5 + Math.floor(rand() * 20),
      });
    }
  };

  for (const se of series) {
    const wall = se.kind === "WALL_MOUNT" || se.kind === "MINI";
    const p: Product = {
      id: id("p"), slug: slugify(se.name), name: se.name, kind: se.kind, uHeight: se.u, hsn: "9403", gstRate: 18,
      sourcing: "MANUFACTURED", categoryId: cats[se.cat],
      description: `${se.name} for network, CCTV and server equipment. Standard 19-inch mounting.`,
    };
    s.products.push(p);
    const mixed = new Set(se.rows.map((x) => x[1])).size > 1;
    for (const [depth, width, height, flag] of se.rows) {
      // Retail is stored GST-inclusive, dealer price GST-exclusive (spec).
      const base = rupees((wall ? 1400 : 4200) + se.u * (wall ? 240 : 410) + depth * 2.2);
      const dealer = Math.round((base * 0.82) / 100) * 100;
      const retail = Math.round((base * 1.18) / 100) * 100;
      const kg = Math.round(4 + se.u * (wall ? 1.1 : 2.4) + depth / 120);
      const v: Variant = {
        id: id("v"), sku: `${se.cat.slice(0, 2).toUpperCase()}${se.u}U-${depth}-${width ?? "NA"}`, productId: p.id,
        depthMm: depth, widthMm: width, heightMm: height,
        label: mixed ? `${depth}mm depth, ${width}mm wide` : `${depth}mm depth`,
        retailPrice: retail, dealerPrice: dealer,
        needsConfirmation: !!flag, confirmNote: flag ?? null,
        weightKg: kg, packedKg: Math.round(kg * 1.12),
        boxSize: `${(width ?? 600) + 60} x ${depth + 60} x ${(height ?? 1000) + 60} mm`,
        shippingClass: se.u >= 27 ? "TATA_ACE" : "THREE_WHEELER", moq: 1,
      };
      s.variants.push(v);
      addStock(v.id);
    }
  }

  const addAcc = (names: string[], cat: string, sourcing: "SOURCED" | "MANUFACTURED", base: number) => {
    for (const [i, name] of names.entries()) {
      const p: Product = {
        id: id("p"), slug: slugify(name), name, kind: "ACCESSORY", sourcing, uHeight: null,
        hsn: sourcing === "SOURCED" ? "8536" : "7326", gstRate: 18, categoryId: cats[cat],
        description: `${name}. Compatible with standard racks and CCTV installations.`,
      };
      s.products.push(p);
      const dealer = rupees(base + i * 135);
      const v: Variant = {
        id: id("v"), sku: `${cat.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`, productId: p.id,
        depthMm: null, widthMm: null, heightMm: null, label: "Standard",
        retailPrice: Math.round((dealer * 1.18) / 100 / 0.85) * 100, dealerPrice: dealer,
        needsConfirmation: false, confirmNote: null,
        weightKg: 1, packedKg: 1, boxSize: "Carton", shippingClass: "THREE_WHEELER", moq: sourcing === "SOURCED" ? 5 : 1,
      };
      s.variants.push(v);
      addStock(v.id);
    }
  };
  addAcc(sourced, "accessories", "SOURCED", 180);
  addAcc(manufactured, "fabrication", "MANUFACTURED", 320);

  const D = (o: Partial<Dealer> & Pick<Dealer, "businessName" | "gstin" | "contactName" | "phone" | "city">): Dealer => ({
    id: id("d"), gstVerified: true, email: `${o.contactName.toLowerCase().replace(/\W/g, "")}@example.com`,
    address: `Plot 12, Main Road, ${o.city}`, status: "APPROVED", tier: "SILVER", homeWarehouse: "HYD", termsDays: 30,
    creditLimit: 0, creditUsed: 0, assignedRep: "Meera (Sales)", appliedAt: new Date(now - 90 * DAY), addresses: [`Shop 4, Market Road, ${o.city}`], ...o,
  });
  s.dealers = [
    D({ businessName: "Sri Sai Networks", gstin: "37AAAAA0000A1Z5", contactName: "Ravi Kumar", phone: "9000000001", city: "Guntur", tier: "GOLD", homeWarehouse: "VJA", creditLimit: rupees(200000), creditUsed: rupees(46000), termsDays: 30 }),
    D({ businessName: "Vision CCTV Solutions", gstin: "36BBBBB1111B1Z6", contactName: "Anil Reddy", phone: "9000000002", city: "Hyderabad", tier: "PLATINUM", homeWarehouse: "HYD", creditLimit: rupees(150000), creditUsed: 0, termsDays: 15 }),
    D({ businessName: "Tirumala Electronics", gstin: "37CCCCC2222C1Z7", contactName: "Lakshmi", phone: "9000000003", city: "Tirupati", gstVerified: false, status: "PENDING", homeWarehouse: "TPT", appliedAt: new Date(now - 1 * DAY) }),
    D({ businessName: "Deccan Infratel", gstin: "36DDDDD3333D1Z8", contactName: "Faisal", phone: "9000000004", city: "Hyderabad", tier: "SILVER", homeWarehouse: "HYD", creditLimit: rupees(80000), creditUsed: rupees(78000), termsDays: 15 }),
  ];
  s.users = [
    { id: id("u"), email: "admin@demo.test", name: "Admin (Owner)", role: "ADMIN", dealerId: null, warehouse: null },
    { id: id("u"), email: "sales@demo.test", name: "Meera (Sales)", role: "SALES", dealerId: null, warehouse: null },
    { id: id("u"), email: "wh-hyd@demo.test", name: "Prakash (Hyderabad hub)", role: "WAREHOUSE", dealerId: null, warehouse: "HYD" },
    { id: id("u"), email: "accounts@demo.test", name: "Sunita (Accounts)", role: "ACCOUNTS", dealerId: null, warehouse: null },
    { id: id("u"), email: "customer@demo.test", name: "Demo Customer", role: "CUSTOMER", dealerId: null, warehouse: null },
    { id: id("u"), email: "dealer@demo.test", name: "Ravi Kumar", role: "DEALER", dealerId: s.dealers[0].id, warehouse: null },
    { id: id("u"), email: "dealer2@demo.test", name: "Anil Reddy", role: "DEALER", dealerId: s.dealers[1].id, warehouse: null },
    { id: id("u"), email: "pending@demo.test", name: "Lakshmi", role: "DEALER", dealerId: s.dealers[2].id, warehouse: null },
  ];

  const L = (o: Partial<Lead> & Pick<Lead, "name" | "phone" | "interest" | "status" | "source">, ago: number): Lead => ({
    id: id("l"), company: null, city: "Hyderabad", assignedTo: "Meera (Sales)", lostReason: null, dealerId: null, createdAt: new Date(now - ago * DAY), ...o,
  });
  s.leads = [
    L({ name: "Suresh", company: "Metro Hospital", phone: "9000000011", interest: "6x 42U server racks", status: "QUOTE_SENT", source: "request-quote", city: "Hyderabad" }, 4),
    L({ name: "Priya", company: "BrightSchool", phone: "9000000012", interest: "CCTV junction boxes bulk", status: "NEW", source: "whatsapp", city: "Vijayawada" }, 1),
    L({ name: "Imran", phone: "9000000013", interest: "Custom 12U wall rack", status: "CONTACTED", source: "website", city: "Guntur" }, 3),
    L({ name: "Kiran", company: "Kiran Telecom", phone: "9000000014", interest: "Dealer registration", status: "WON", source: "dealer-registration", city: "Nellore" }, 12),
    L({ name: "Naveen", company: "Apex Networks", phone: "9000000015", interest: "20x 9U wall racks, tender", status: "NEGOTIATION", source: "indiamart", city: "Bengaluru" }, 6),
    L({ name: "Gopal", company: "Sai Stores", phone: "9000000016", interest: "Rack trays", status: "LOST", source: "walk-in", city: "Tirupati", lostReason: "Price too high" }, 20),
    L({ name: "Tirumala Electronics", company: "Tirumala Electronics", phone: "9000000003", interest: "Dealer application - review", status: "NEW", source: "dealer-registration", city: "Tirupati", dealerId: s.dealers[2].id }, 1),
  ];

  // Orders seeded through the same totals logic the checkout uses.
  const mk = (vIdx: number, qty: number, dealer: Dealer | null, status: OrderStatus, ago: number, o: Partial<Order> = {}) => {
    const v = s.variants[vIdx];
    const p = s.products.find((x) => x.id === v.productId)!;
    const unit = dealer ? v.dealerPrice : v.retailPrice;
    const wh = dealer?.homeWarehouse ?? "HYD";
    const sellerState = wh === "HYD" ? "Telangana" : "Andhra Pradesh";
    const buyerState = dealer ? (dealer.gstin.startsWith("36") ? "Telangana" : "Andhra Pradesh") : "Telangana";
    const g = dealer ? gstBreakup([{ amount: unit * qty, rate: 18 }], sellerState, buyerState) : gstBreakupInclusive([{ amount: unit * qty, rate: 18 }], sellerState, buyerState);
    const oid = id("o");
    const number = `RK-${10001 + s.orders.length}`;
    const at = new Date(now - ago * DAY);
    const confirmed = !["PLACED", "PAYMENT_PENDING", "CANCELLED"].includes(status);
    s.orders.push({
      id: oid, number, status, userId: null, dealerId: dealer?.id ?? null, buyerType: dealer ? "DEALER" : "RETAIL",
      customerName: dealer?.businessName ?? "Demo Customer", customerPhone: dealer?.phone ?? "9000000099",
      customerGstin: dealer?.gstin ?? null, shipState: buyerState, city: dealer?.city ?? "Hyderabad",
      subtotal: g.subtotal, gstAmount: g.gstTotal, cgst: g.cgst, sgst: g.sgst, igst: g.igst, shipping: 0, total: g.total,
      paymentMode: dealer ? "CREDIT" : "ONLINE", delivery: "FREIGHT", warehouses: [wh], split: false,
      invoiceNo: confirmed ? `${s.settings.invoiceSeries}${String(++s.invoiceSeq).padStart(4, "0")}` : null,
      proformaNo: status === "PAYMENT_PENDING" ? `PF/${number}` : null, utr: null, paid: confirmed && !dealer,
      holdUntil: status === "PAYMENT_PENDING" ? new Date(now + 2 * DAY) : null,
      dueDate: dealer && confirmed ? new Date(at.getTime() + dealer.termsDays * DAY) : null,
      dispatch: ["DISPATCHED", "DELIVERED"].includes(status) ? { vehicleType: "Three-wheeler", vehicleNo: "TS09 UB 4411", driverPhone: "9000011111", bookingId: `PRT-${5000 + s.orders.length}` } : null,
      ewayRequired: g.total > 5000000, ewayBill: null, pod: status === "DELIVERED",
      timeline: [{ status: "PLACED", at, by: dealer?.contactName ?? "Customer" }, ...(confirmed ? [{ status: "CONFIRMED", at, by: "System" }] : [])],
      createdAt: at, ...o,
    });
    s.items.push({ id: id("i"), orderId: oid, variantId: v.id, qty, unitPrice: unit, gstRate: p.gstRate });
  };
  const d0 = s.dealers[0], d1 = s.dealers[1], d3 = s.dealers[3];
  const net = s.variants.findIndex((v) => v.sku.startsWith("NE42U"));
  mk(2, 4, d0, "DELIVERED", 40);
  mk(5, 3, d0, "DISPATCHED", 6);
  mk(8, 2, d1, "PACKED", 3);
  mk(net, 2, d3, "CONFIRMED", 20, { dueDate: new Date(now - 5 * DAY) }); // overdue credit order
  mk(12, 2, d1, "PAYMENT_PENDING", 1, { paymentMode: "BANK TRANSFER" });
  mk(4, 1, null, "CONFIRMED", 2);
  mk(6, 5, null, "DELIVERED", 15);

  s.quotes = [
    {
      id: id("q"), number: "QT-2001", dealerId: d0.id, leadId: null, status: "SENT", discountPct: 5, version: 1,
      validUntil: new Date(now + 7 * DAY), createdBy: "Meera (Sales)", createdAt: new Date(now - 2 * DAY), orderNumber: null,
      note: "Bulk pricing for Guntur project.",
      items: [{ variantId: s.variants[net].id, qty: 6, listPrice: s.variants[net].dealerPrice, unitPrice: Math.round(s.variants[net].dealerPrice * 0.95 / 100) * 100 }],
    },
    {
      id: id("q"), number: "QT-2002", dealerId: d1.id, leadId: null, status: "PENDING_APPROVAL", discountPct: 14, version: 1,
      validUntil: new Date(now + 5 * DAY), createdBy: "Meera (Sales)", createdAt: new Date(now - 1 * DAY), orderNumber: null,
      note: "Discount above 10% needs manager approval.",
      items: [{ variantId: s.variants[10].id, qty: 10, listPrice: s.variants[10].dealerPrice, unitPrice: Math.round(s.variants[10].dealerPrice * 0.86 / 100) * 100 }],
    },
  ];
  s.tickets = [
    { id: id("t"), number: "TK-3001", type: "DAMAGE", status: "OPEN", dealerId: d0.id, orderNumber: "RK-10002", subject: "Side panel dented on arrival", message: "Photos attached. Please arrange replacement.", assignedTo: "Meera (Sales)", createdAt: new Date(now - 1 * DAY) },
    { id: id("t"), number: "TK-3002", type: "INSTALL", status: "IN_PROGRESS", dealerId: d1.id, orderNumber: null, subject: "Need mounting guide for 37U rack", message: "Customer site visit tomorrow.", assignedTo: "Meera (Sales)", createdAt: new Date(now - 3 * DAY) },
  ];
  s.tasks = [
    { id: id("k"), title: "Review dealer application: Tirumala Electronics", due: new Date(now + 0.5 * DAY), done: false, ref: s.dealers[2].id, owner: "Meera (Sales)", auto: true },
    { id: id("k"), title: "Chase overdue payment: Deccan Infratel", due: new Date(now), done: false, ref: d3.id, owner: "Sunita (Accounts)", auto: true },
    { id: id("k"), title: "Follow up quote QT-2001 (no reply)", due: new Date(now + 1 * DAY), done: false, ref: "QT-2001", owner: "Meera (Sales)", auto: true },
    { id: id("k"), title: "Send samples to Apex Networks", due: new Date(now + 2 * DAY), done: false, ref: null, owner: "Meera (Sales)", auto: false },
  ];
  const W = s.warehouses;
  s.movements = [
    { id: id("m"), variantId: s.variants[5].id, warehouseId: W[0].id, delta: 40, type: "RECEIPT", reason: "Goods received from workshop", by: "Prakash (Hyderabad hub)", at: new Date(now - 5 * DAY) },
    { id: id("m"), variantId: s.variants[8].id, warehouseId: W[1].id, delta: -2, type: "ORDER", reason: "RK-10003", by: "System", at: new Date(now - 3 * DAY) },
    { id: id("m"), variantId: s.variants[3].id, warehouseId: W[2].id, delta: -1, type: "DAMAGE", reason: "Damaged in handling", by: "Admin (Owner)", at: new Date(now - 2 * DAY) },
  ];
  s.activity = [
    { id: id("a"), who: "Admin (Owner)", action: "Approved dealer Vision CCTV Solutions (Platinum, HYD, credit Rs 1,50,000)", at: new Date(now - 30 * DAY) },
    { id: id("a"), who: "Admin (Owner)", action: "Changed price tier discounts", at: new Date(now - 10 * DAY) },
    { id: id("a"), who: "Prakash (Hyderabad hub)", action: "Stock adjustment: -1 damaged (Tirupati)", at: new Date(now - 2 * DAY) },
  ];
  s.notifications = [
    { id: id("n"), event: "Dealer application submitted", to: "Admin, Sales", channels: ["Email", "In-app"], text: "Tirumala Electronics applied for a dealer account.", ref: s.dealers[2].id, at: new Date(now - 1 * DAY) },
  ];
  s.seq = n;
  return s;
}

// Bump SEED_VERSION when the seed shape changes so a running dev server drops its stale copy.
const SEED_VERSION = 2;
const g = globalThis as unknown as { __mockState?: State; __mockVersion?: number };
const S = () => {
  if (!g.__mockState || g.__mockVersion !== SEED_VERSION) {
    g.__mockState = seed();
    g.__mockVersion = SEED_VERSION;
  }
  return g.__mockState;
};

// ---- Helpers shared by pages and server actions -----------------------------
export const mock = {
  S,
  id: (p: string) => `${p}${++S().seq}`,
  log(who: string, action: string) {
    S().activity.unshift({ id: mock.id("a"), who, action, at: new Date() });
  },
  notify(event: string, to: string, channels: string[], text: string, ref: string | null = null) {
    S().notifications.unshift({ id: mock.id("n"), event, to, channels, text, ref, at: new Date() });
  },
  stockTotal: (variantId: string, warehouseCode?: string) =>
    S().stock
      .filter((x) => x.variantId === variantId && (!warehouseCode || S().warehouses.find((w) => w.id === x.warehouseId)?.code === warehouseCode))
      .reduce((n, x) => n + x.qty, 0),
  nextInvoice() {
    return `${S().settings.invoiceSeries}${String(++S().invoiceSeq).padStart(4, "0")}`;
  },
  variantName(variantId: string) {
    const v = S().variants.find((x) => x.id === variantId);
    const p = v && S().products.find((x) => x.id === v.productId);
    return v && p ? `${p.name} (${v.label})` : "Unknown item";
  },
};

// ---- Hydration helpers (always include relations; cheap at this size) --------
const stockOf = (variantId: string) =>
  S().stock.filter((x) => x.variantId === variantId).map((x) => ({ ...x, warehouse: S().warehouses.find((w) => w.id === x.warehouseId)! }));
const variantFull = (v: Variant) => ({ ...v, stock: stockOf(v.id), product: S().products.find((p) => p.id === v.productId)! });
const productFull = (p: Product) => ({
  ...p,
  category: S().categories.find((c) => c.id === p.categoryId)!,
  variants: S().variants.filter((v) => v.productId === p.id).sort((a, b) => a.retailPrice - b.retailPrice).map((v) => ({ ...v, stock: stockOf(v.id) })),
});
const orderFull = (o: Order) => ({
  ...o,
  items: S().items.filter((i) => i.orderId === o.id).map((i) => ({ ...i, variant: variantFull(S().variants.find((v) => v.id === i.variantId)!) })),
});
const userFull = (u: User) => ({ ...u, dealer: u.dealerId ? (S().dealers.find((d) => d.id === u.dealerId) ?? null) : null });

const byU = (a: Product, b: Product) => (a.uHeight ?? 1e9) - (b.uHeight ?? 1e9) || a.name.localeCompare(b.name);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export const db = {
  category: {
    async findMany(_args?: Any) {
      return [...S().categories].sort((a, b) => a.sort - b.sort).map((c) => ({ ...c, _count: { products: S().products.filter((p) => p.categoryId === c.id).length } }));
    },
    async findUnique({ where }: Any) {
      return S().categories.find((c) => c.slug === where.slug) ?? null;
    },
  },
  product: {
    async findMany({ where = {}, take }: Any = {}) {
      let list = S().products.filter((p) => {
        if (where.category?.slug && S().categories.find((c) => c.id === p.categoryId)?.slug !== where.category.slug) return false;
        if (where.uHeight && p.uHeight !== where.uHeight) return false;
        if (where.name?.contains && !p.name.toLowerCase().includes(String(where.name.contains).toLowerCase())) return false;
        if (where.kind?.in && !where.kind.in.includes(p.kind)) return false;
        if (where.variants?.some?.depthMm && !S().variants.some((v) => v.productId === p.id && v.depthMm === where.variants.some.depthMm)) return false;
        return true;
      }).sort(byU);
      if (take) list = list.slice(0, take);
      return list.map(productFull);
    },
    async findUnique({ where }: Any) {
      const p = S().products.find((x) => x.slug === where.slug);
      return p ? productFull(p) : null;
    },
  },
  variant: {
    async findMany({ where = {}, orderBy }: Any = {}) {
      let list = S().variants.filter((v) => {
        if (where.id?.in && !where.id.in.includes(v.id)) return false;
        if (where.product?.category?.slug) {
          const p = S().products.find((x) => x.id === v.productId)!;
          if (S().categories.find((c) => c.id === p.categoryId)?.slug !== where.product.category.slug) return false;
        }
        return true;
      });
      const prod = (v: Variant) => S().products.find((p) => p.id === v.productId)!;
      const key = Object.keys(orderBy?.[0]?.product ?? {})[0];
      if (key === "uHeight") list = list.sort((a, b) => byU(prod(a), prod(b)) || (a.depthMm ?? 0) - (b.depthMm ?? 0));
      else if (key === "name") list = list.sort((a, b) => prod(a).name.localeCompare(prod(b).name) || (a.depthMm ?? 0) - (b.depthMm ?? 0));
      return list.map(variantFull);
    },
  },
  warehouse: {
    async findMany(_args?: Any) {
      return [...S().warehouses].sort((a, b) => a.code.localeCompare(b.code));
    },
  },
  stock: {
    async count({ where }: Any) {
      return S().stock.filter((x) => x.qty < where.qty.lt).length;
    },
    async update({ where, data }: Any) {
      const { variantId, warehouseId } = where.variantId_warehouseId;
      const row = S().stock.find((x) => x.variantId === variantId && x.warehouseId === warehouseId);
      if (row) row.qty = data.qty;
      return row;
    },
  },
  user: {
    async findMany({ where = {} }: Any = {}) {
      const roles: Role[] | undefined = where.role?.in ?? (where.role ? [where.role] : undefined);
      return S().users.filter((u) => !roles || roles.includes(u.role)).map(userFull);
    },
    async findUnique({ where }: Any) {
      const u = S().users.find((x) => x.id === where.id);
      return u ? userFull(u) : null;
    },
  },
  dealer: {
    async findUniqueOrThrow({ where }: Any) {
      const d = S().dealers.find((x) => x.id === where.id);
      if (!d) throw new Error("Dealer not found");
      return d;
    },
    async update({ where, data }: Any) {
      const d = S().dealers.find((x) => x.id === where.id)!;
      if (data.creditUsed?.increment) d.creditUsed += data.creditUsed.increment;
      return d;
    },
  },
  order: {
    async count() {
      return S().orders.length;
    },
    async aggregate({ where }: Any) {
      const ex = where?.status?.not;
      return { _sum: { total: S().orders.filter((o) => o.status !== ex).reduce((n, o) => n + o.total, 0) } };
    },
    async findMany({ where = {}, take }: Any = {}) {
      let list = S().orders.filter((o) => !where.dealerId || o.dealerId === where.dealerId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      if (take) list = list.slice(0, take);
      return list.map(orderFull);
    },
    async findUnique({ where }: Any) {
      const o = S().orders.find((x) => x.number === where.number);
      return o ? orderFull(o) : null;
    },
    async create({ data }: Any) {
      const { items, ...rest } = data;
      const o = {
        id: `o${++S().seq}`, status: "PLACED", userId: null, dealerId: null, buyerType: "RETAIL", customerGstin: null,
        shipping: 0, cgst: 0, sgst: 0, igst: 0, city: "", paymentMode: "ONLINE", delivery: "FREIGHT", warehouses: [], split: false,
        invoiceNo: null, proformaNo: null, utr: null, paid: false, holdUntil: null, dueDate: null, dispatch: null,
        ewayRequired: false, ewayBill: null, pod: false, timeline: [], createdAt: new Date(), ...rest,
      } as Order;
      S().orders.push(o);
      for (const it of items.create) S().items.push({ id: `i${++S().seq}`, orderId: o.id, ...it });
      return o;
    },
    async update({ where, data }: Any) {
      const o = S().orders.find((x) => x.id === where.id)!;
      Object.assign(o, data);
      return o;
    },
  },
  lead: {
    async count({ where }: Any) {
      return S().leads.filter((l) => !where?.status || l.status === where.status).length;
    },
    async findMany() {
      return [...S().leads].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
    async update({ where, data }: Any) {
      const l = S().leads.find((x) => x.id === where.id)!;
      Object.assign(l, data);
      return l;
    },
  },
  async $transaction(ops: Promise<unknown>[]) {
    return Promise.all(ops);
  },
};

export { orderFull, variantFull, productFull };
