"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

const Ctx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string }[]>([]);
  const push = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setItems((c) => [...c, { id, msg }]);
    setTimeout(() => setItems((c) => c.filter((x) => x.id !== id)), 3400);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2 print:hidden">
        {items.map((t) => (
          <div key={t.id} className="rounded-xl bg-brand px-4 py-3 text-sm font-medium text-white shadow-[var(--shadow-lg)]">
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
