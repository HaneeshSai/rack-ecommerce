"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { payInvoice } from "@/lib/actions/dealer";
import { inr } from "@/lib/money";

const METHODS = ["UPI", "Card", "Net banking"];

// Demo checkout for paying an invoice online: pick a method and confirm.
export function PayInvoice({ kind, id, amount }: { kind: "order" | "crm"; id: string; amount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState(METHODS[0]);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) return <span className="text-xs font-semibold text-emerald-700">{done}</span>;
  if (!open) return <Button className="!py-1.5" onClick={() => setOpen(true)}>Pay now</Button>;
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {METHODS.map((m) => (
        <button key={m} type="button" onClick={() => setMethod(m)} className={`rounded-full border px-3 py-1 text-xs ${m === method ? "border-accent bg-accent-soft font-semibold" : "border-line bg-white"}`}>{m}</button>
      ))}
      <Button
        className="!py-1.5"
        disabled={pending}
        onClick={() => start(async () => {
          const r = await payInvoice(kind, id, method);
          if (r.ok) { setDone("Paid (demo)"); router.refresh(); } else setDone(r.msg);
        })}
      >
        Pay {inr(amount)}
      </Button>
    </div>
  );
}
