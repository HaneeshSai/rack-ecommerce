"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/components/admin/toast";

export type ActionResult = { ok: boolean; msg: string; id?: string };

// Runs a CRM server action, shows its message as a toast and refreshes the page data.
export function useRun() {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  function run(fn: () => Promise<ActionResult>, then?: (r: ActionResult) => void) {
    start(async () => {
      const r = await fn();
      toast(r.msg);
      if (r.ok) {
        router.refresh();
        then?.(r);
      }
    });
  }
  return { run, pending };
}
