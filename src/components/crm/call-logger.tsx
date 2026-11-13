"use client";

import { useState } from "react";
import { Button, inputCls } from "@/components/ui";
import { logDealerCall } from "@/lib/actions/crm";
import { useRun } from "./use-run";

export function CallLogger({ dealerId }: { dealerId: string }) {
  const { run, pending } = useRun();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  if (!open) return <button className="text-xs font-semibold text-accent" onClick={() => setOpen(true)}>Log a call</button>;
  return (
    <div className="flex min-w-48 gap-1">
      <input className={inputCls} placeholder="What was discussed?" value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
      <Button variant="ghost" className="!px-2 !py-1" disabled={pending} onClick={() => run(() => logDealerCall(dealerId, note), () => { setOpen(false); setNote(""); })}>Save</Button>
    </div>
  );
}
