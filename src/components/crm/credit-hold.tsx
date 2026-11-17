"use client";

import { useState } from "react";
import { Button, inputCls } from "@/components/ui";
import { releaseCreditHold, setCreditHold } from "@/lib/actions/crm";
import { useRun } from "./use-run";

export function CreditHold({ dealerId, held }: { dealerId: string; held: boolean }) {
  const { run, pending } = useRun();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  if (!open)
    return <Button variant="ghost" className="!py-1.5" onClick={() => setOpen(true)}>{held ? "Release hold" : "Put credit on hold"}</Button>;
  return (
    <div className="flex flex-wrap gap-2">
      <input className={inputCls + " min-w-64 flex-1"} placeholder={held ? "Why release it?" : "Why hold credit?"} value={text} onChange={(e) => setText(e.target.value)} />
      <Button className="!py-1.5" disabled={pending} onClick={() => run(() => (held ? releaseCreditHold(dealerId, text) : setCreditHold(dealerId, text)), () => { setOpen(false); setText(""); })}>{held ? "Release" : "Hold"}</Button>
      <Button variant="ghost" className="!py-1.5" onClick={() => setOpen(false)}>Cancel</Button>
    </div>
  );
}
