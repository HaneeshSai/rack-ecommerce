"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

const statuses = ["PENDING", "PAID", "PACKED", "DISPATCHED", "DELIVERED", "CANCELLED"] as const;
const leadStatuses = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST"] as const;

export async function setOrderStatus(orderId: string, formData: FormData) {
  await requireUser("ADMIN");
  const status = z.enum(statuses).parse(formData.get("status"));
  await db.order.update({ where: { id: orderId }, data: { status } });
  revalidatePath("/orders");
}

export async function setLeadStatus(leadId: string, formData: FormData) {
  await requireUser("ADMIN");
  const status = z.enum(leadStatuses).parse(formData.get("status"));
  await db.lead.update({ where: { id: leadId }, data: { status } });
  revalidatePath("/leads");
}

export async function setStock(variantId: string, warehouseId: string, formData: FormData) {
  await requireUser("ADMIN");
  const qty = z.coerce.number().int().min(0).max(100000).parse(formData.get("qty"));
  await db.stock.update({ where: { variantId_warehouseId: { variantId, warehouseId } }, data: { qty } });
  revalidatePath("/stock");
}
