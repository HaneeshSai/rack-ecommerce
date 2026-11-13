"use client";

import { useState } from "react";
import { Button, inputCls } from "@/components/ui";
import { logFollowup } from "@/lib/actions/crm";
import { useRun } from "./use-run";

export function QuickFollowup({ orderId }: { orderId: string }) {
  const { run, pending } = useRun();
  const [note, setNote] = useState("");
  const [promise, setPromise] = useState("");
  return (
    <div className="flex min-w-64 flex-wrap gap-2">
      <input className={inputCls + " flex-1"} placeholder="Called, said…" value={note} onChange={(e) => setNote(e.target.value)} />
      <input type="date" className={inputCls + " w-36"} value={promise} onChange={(e) => setPromise(e.target.value)} aria-label="Promised date" />
      <Button variant="ghost" className="!py-1.5" disabled={pending} onClick={() => run(() => logFollowup(orderId, { note, promiseDate: promise }), () => { setNote(""); setPromise(""); })}>Save</Button>
    </div>
  );
}
