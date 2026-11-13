"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { addFollowupTask } from "@/lib/actions/crm";
import { useRun } from "./use-run";

export function FollowupButton({ title, refId }: { title: string; refId: string }) {
  const { run, pending } = useRun();
  const [done, setDone] = useState(false);
  return (
    <Button variant="ghost" className="!py-1.5 whitespace-nowrap" disabled={pending || done} onClick={() => run(() => addFollowupTask(title, refId), () => setDone(true))}>
      {done ? "Task created" : "Create task"}
    </Button>
  );
}
