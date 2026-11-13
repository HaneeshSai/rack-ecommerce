"use server";

import { mock, type CrmOrder } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { crmTotals, DAY } from "@/lib/crm-data";
import { gstinFormatOk, LOGISTICS_PROVIDERS } from "@/lib/crm";
import type { Tier } from "@/lib/logistics";

// Prototype actions: they change the in-memory demo data only.
type R = { ok: boolean; msg: string; id?: string };
const fail = (msg: string): R => ({ ok: false, msg });
const find = (id: string) => mock.S().crmOrders.find((o) => o.id === id);
const step = (o: CrmOrder, by: string, text: string) => o.timeline.push({ at: new Date(), by, text });

export async function createSalesOrder(input: {
  dealerId: string; rep: string; terms: string; hub: string; notes: string; lines: { variantId: string; qty: number; price: number }[];
}): Promise<R> {
  const u = await requireUser("CRM");
  const S = mock.S();
  const lines = input.lines.filter((l) => l.variantId && l.qty > 0 && l.price > 0);
  if (!S.dealers.some((d) => d.id === input.dealerId)) return fail("Pick a dealer.");
  if (!lines.length) return fail("Add at least one item with a quantity and price.");
  const n = 5000 + S.crmOrders.length + 1;
  const o: CrmOrder = {
    id: mock.id("so"), number: `SO-${n}`, dealerId: input.dealerId, fieldRep: input.rep, lines, terms: input.terms, hub: input.hub,
    stage: "NEW", notes: input.notes, proformaNo: null, invoiceNo: null, dcNo: null, vehicle: null, dueDate: null, payment: null,
    followups: [], timeline: [], createdAt: new Date(), delivered: false,
  };
  step(o, input.rep, `Sales order received from ${input.rep}`);
  step(o, u.name, "Order entered into CRM");
  S.crmOrders.unshift(o);
  mock.log(u.name, `Created sales order ${o.number}`);
  return { ok: true, msg: `Sales order ${o.number} created`, id: o.id };
}

// Step 2: screen and send to accounts with variants, qty, price, terms.
export async function sendToAccounts(id: string): Promise<R> {
  const u = await requireUser("CRM");
  const o = find(id);
  if (!o || o.stage !== "NEW") return fail("Order is not waiting for screening.");
  o.stage = "WITH_ACCOUNTS";
  if (o.terms.startsWith("Advance") && !o.proformaNo) o.proformaNo = `PF/${o.number}`;
  step(o, u.name, "Screened and sent to accounts");
  mock.notify("Order sent to accounts", "Accounts", ["Email", "In-app"], `${o.number}: items, quantities, prices and ${o.terms} terms attached.`, o.number);
  return { ok: true, msg: `${o.number} sent to accounts` };
}

// Billing support: proforma for bank-transfer customers.
export async function issueProforma(id: string): Promise<R> {
  const u = await requireUser("CRM");
  const o = find(id);
  if (!o) return fail("Order not found.");
  o.proformaNo = o.proformaNo ?? `PF/${o.number}`;
  step(o, u.name, `Proforma ${o.proformaNo} issued for NEFT/RTGS`);
  mock.notify("Proforma issued", o.dealerId, ["WhatsApp", "Email"], `Proforma ${o.proformaNo} sent for payment by NEFT/RTGS.`, o.number);
  return { ok: true, msg: `Proforma ${o.proformaNo} issued` };
}

// Step 3: accounts sends invoice and DC.
export async function recordInvoice(id: string, input: { invoiceNo: string; dcNo: string }): Promise<R> {
  const u = await requireUser("CRM");
  const o = find(id);
  if (!o || o.stage !== "WITH_ACCOUNTS") return fail("Order is not with accounts.");
  if (!input.invoiceNo.trim() || !input.dcNo.trim()) return fail("Enter both the invoice number and the DC number.");
  o.invoiceNo = input.invoiceNo.trim();
  o.dcNo = input.dcNo.trim();
  o.stage = "INVOICED";
  const d = mock.S().dealers.find((x) => x.id === o.dealerId);
  if (d && o.terms.startsWith("Credit")) d.creditUsed += crmTotals(o).total;
  step(o, u.name, `Invoice ${o.invoiceNo} and DC ${o.dcNo} received from accounts`);
  return { ok: true, msg: "Invoice and DC recorded" };
}

// Step 4: arrange the vehicle (Porter or other).
export async function bookVehicle(id: string, v: NonNullable<CrmOrder["vehicle"]>): Promise<R> {
  const u = await requireUser("CRM");
  const o = find(id);
  if (!o || o.stage !== "INVOICED") return fail("Invoice and DC must be recorded first.");
  if (!LOGISTICS_PROVIDERS.includes(v.provider)) return fail("Pick a logistics provider.");
  if (!v.vehicleNo.trim() && v.provider !== "Transport / courier") return fail("Enter the vehicle number.");
  o.vehicle = { ...v, vehicleNo: v.vehicleNo.trim().toUpperCase() };
  o.stage = "LOGISTICS";
  step(o, u.name, `Vehicle booked on ${v.provider}${v.bookingId ? ` (${v.bookingId})` : ""}`);
  return { ok: true, msg: "Vehicle booked" };
}

// Step 5: dispatch and inform the field sales person.
export async function dispatchOrder(id: string): Promise<R> {
  const u = await requireUser("CRM");
  const o = find(id);
  if (!o || o.stage !== "LOGISTICS") return fail("Book a vehicle first.");
  o.stage = "DISPATCHED";
  step(o, u.name, `Dispatched from ${o.hub}; ${o.fieldRep} informed`);
  mock.notify("Order dispatched", o.fieldRep, ["WhatsApp"], `${o.number} dispatched from ${o.hub} on ${o.vehicle?.vehicleNo}. Driver ${o.vehicle?.driverName} ${o.vehicle?.driverPhone}.`, o.number);
  return { ok: true, msg: `Dispatched. ${o.fieldRep} informed` };
}

// Step 6: send invoice, DC and driver details to the dealer. Starts the payment clock.
export async function sendDocsToDealer(id: string): Promise<R> {
  const u = await requireUser("CRM");
  const o = find(id);
  if (!o || o.stage !== "DISPATCHED") return fail("Dispatch the order first.");
  o.stage = "DOCS_SENT";
  const days = Number(o.terms.match(/(\d+) days/)?.[1] ?? 0);
  o.dueDate = days ? new Date(Date.now() + days * DAY) : new Date();
  step(o, u.name, "Invoice, DC and driver details sent to dealer");
  mock.notify("Dispatch documents sent", o.dealerId, ["WhatsApp", "Email"], `Invoice ${o.invoiceNo}, DC ${o.dcNo}, vehicle ${o.vehicle?.vehicleNo}, driver ${o.vehicle?.driverPhone}.`, o.number);
  return { ok: true, msg: "Documents sent to dealer" };
}

// Step 7: payment follow-up, in coordination with the sales guy.
export async function logFollowup(id: string, input: { note: string; promiseDate: string }): Promise<R> {
  const u = await requireUser("CRM");
  const o = find(id);
  if (!o) return fail("Order not found.");
  if (!input.note.trim()) return fail("Write what was said.");
  o.followups.unshift({ at: new Date(), by: u.name, note: input.note.trim(), promiseDate: input.promiseDate || null });
  step(o, u.name, `Payment follow-up: ${input.note.trim()}`);
  return { ok: true, msg: "Follow-up saved" };
}

export async function recordPayment(id: string, input: { utr: string; amount: number; mode: string }): Promise<R> {
  const u = await requireUser("CRM");
  const o = find(id);
  if (!o || o.stage !== "DOCS_SENT") return fail("Order is not waiting for payment.");
  if (!input.utr.trim()) return fail("Enter the UTR or reference number.");
  o.payment = { utr: input.utr.trim(), amount: Math.round(input.amount * 100), mode: input.mode, at: new Date(), reported: false };
  step(o, u.name, `Payment received (${input.mode}, ${input.utr.trim()})`);
  return { ok: true, msg: "Payment recorded. Report it to accounts." };
}

// Step 8: report the payment to accounts and close the order.
export async function reportPayment(id: string): Promise<R> {
  const u = await requireUser("CRM");
  const o = find(id);
  if (!o?.payment) return fail("Record the payment first.");
  o.payment.reported = true;
  o.stage = "PAID";
  const d = mock.S().dealers.find((x) => x.id === o.dealerId);
  if (d && o.terms.startsWith("Credit")) d.creditUsed = Math.max(0, d.creditUsed - crmTotals(o).total);
  step(o, u.name, "Payment reported to accounts");
  mock.notify("Payment reported", "Accounts", ["Email", "In-app"], `${o.number}: ${o.payment.mode} ${o.payment.utr} received.`, o.number);
  return { ok: true, msg: "Payment reported to accounts" };
}

// Dealer onboarding.
export async function verifyGstin(dealerId: string): Promise<R> {
  const u = await requireUser("CRM");
  const d = mock.S().dealers.find((x) => x.id === dealerId);
  if (!d) return fail("Dealer not found.");
  if (!gstinFormatOk(d.gstin)) return fail("GSTIN format is not valid. Ask the dealer to correct it.");
  d.gstVerified = true;
  mock.log(u.name, `Verified GSTIN for ${d.businessName}`);
  return { ok: true, msg: "GSTIN verified (format check in this demo)" };
}

export async function approveDealer(dealerId: string, input: { tier: Tier; hub: string; creditLimit: number; termsDays: number }): Promise<R> {
  const u = await requireUser("CRM");
  const d = mock.S().dealers.find((x) => x.id === dealerId);
  if (!d) return fail("Dealer not found.");
  if (!d.gstVerified) return fail("Verify the GSTIN before approving.");
  d.status = "APPROVED";
  d.tier = input.tier;
  d.homeWarehouse = input.hub;
  d.creditLimit = Math.round(input.creditLimit * 100);
  d.termsDays = input.termsDays;
  mock.log(u.name, `Approved dealer ${d.businessName} (${input.tier.toLowerCase()}, ${input.hub})`);
  mock.notify("Dealer approved", d.businessName, ["Email", "WhatsApp"], "Your dealer account is approved. You can sign in and order.", d.id);
  return { ok: true, msg: `${d.businessName} approved` };
}

export async function rejectDealer(dealerId: string): Promise<R> {
  const u = await requireUser("CRM");
  const d = mock.S().dealers.find((x) => x.id === dealerId);
  if (!d) return fail("Dealer not found.");
  d.status = "REJECTED";
  mock.log(u.name, `Rejected dealer application ${d.businessName}`);
  return { ok: true, msg: `${d.businessName} rejected` };
}

export async function updateDealerProfile(dealerId: string, input: { contactName: string; phone: string; email: string; address: string }): Promise<R> {
  const u = await requireUser("CRM");
  const d = mock.S().dealers.find((x) => x.id === dealerId);
  if (!d) return fail("Dealer not found.");
  Object.assign(d, input);
  mock.log(u.name, `Updated profile of ${d.businessName}`);
  return { ok: true, msg: "Profile updated" };
}

// Relationship management and enquiry follow-ups.
export async function logDealerCall(dealerId: string, note: string): Promise<R> {
  const u = await requireUser("CRM");
  const d = mock.S().dealers.find((x) => x.id === dealerId);
  if (!d) return fail("Dealer not found.");
  mock.log(u.name, `Called ${d.businessName}: ${note.trim() || "checked in"}`);
  return { ok: true, msg: `Call logged for ${d.businessName}` };
}

export async function addFollowupTask(title: string, ref: string | null): Promise<R> {
  const u = await requireUser("CRM");
  const S = mock.S();
  S.tasks.unshift({ id: mock.id("k"), title, due: new Date(Date.now() + DAY), done: false, ref, owner: u.name, auto: false });
  return { ok: true, msg: "Follow-up task created for tomorrow" };
}

export async function markDelivered(id: string): Promise<R> {
  const u = await requireUser("CRM");
  const o = find(id);
  if (!o) return fail("Order not found.");
  o.delivered = true;
  step(o, u.name, "Goods delivered to dealer");
  return { ok: true, msg: "Marked as delivered" };
}
