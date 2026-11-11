"use client";

import { useState } from "react";
import { Badge, Button, Card, inputCls } from "@/components/ui";
import { fmtDate } from "@/components/admin/format";
import { useToast } from "@/components/admin/toast";

type Task = { id: string; title: string; due: string; done: boolean; owner: string; auto: boolean };

export function TaskList({ initial, owners, me, now }: { initial: Task[]; owners: string[]; me: string; now: string }) {
  const toast = useToast();
  const [tasks, setTasks] = useState(initial);
  const [owner, setOwner] = useState("");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState(now.slice(0, 10));
  const [who, setWho] = useState(owners.includes(me) ? me : owners[0] ?? "");

  const nowMs = new Date(now).getTime();
  const startOfTomorrow = new Date(new Date(now).toDateString()).getTime() + 864e5 * 2;
  const todayEnd = startOfTomorrow - 864e5;
  const visible = tasks.filter((t) => !owner || t.owner === owner);
  const open = visible.filter((t) => !t.done);
  const groups: [string, Task[]][] = [
    ["Overdue", open.filter((t) => new Date(t.due).getTime() < nowMs - 36e5 * 12)],
    ["Today", open.filter((t) => { const d = new Date(t.due).getTime(); return d >= nowMs - 36e5 * 12 && d < todayEnd; })],
    ["Upcoming", open.filter((t) => new Date(t.due).getTime() >= todayEnd)],
    ["Done", visible.filter((t) => t.done)],
  ];

  const toggle = (id: string) => setTasks((c) => c.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const add = () => {
    if (!title.trim()) return;
    setTasks((c) => [{ id: `t-${Date.now()}`, title: title.trim(), due: new Date(due + "T09:00:00").toISOString(), done: false, owner: who, auto: false }, ...c]);
    setTitle("");
    toast("Task added.");
  };

  return (
    <>
      <Card className="mb-5 flex flex-wrap items-end gap-3 p-4 text-sm">
        <label className="min-w-56 flex-1 font-medium">New task
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Call back Imran about 12U rack" className={inputCls + " mt-1"} />
        </label>
        <label className="font-medium">Due<input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={inputCls + " mt-1"} /></label>
        <label className="font-medium">Owner
          <select value={who} onChange={(e) => setWho(e.target.value)} className={inputCls + " mt-1"}>{owners.map((o) => <option key={o}>{o}</option>)}</select>
        </label>
        <Button onClick={add}>Add task</Button>
        <label className="ml-auto font-medium">Show
          <select value={owner} onChange={(e) => setOwner(e.target.value)} className={inputCls + " mt-1"}>
            <option value="">Everyone</option>{owners.map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
      </Card>

      <div className="space-y-5">
        {groups.map(([label, list]) => (
          <section key={label}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">{label} ({list.length})</h2>
            <Card className="divide-y divide-line">
              {list.length === 0 && <p className="p-4 text-sm text-muted">Nothing here.</p>}
              {list.map((t) => (
                <label key={t.id} className="flex cursor-pointer items-center gap-3 p-4 text-sm">
                  <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} className="h-4 w-4" />
                  <span className={t.done ? "text-muted line-through" : "font-medium"}>{t.title}</span>
                  <span className="ml-auto flex shrink-0 items-center gap-2">
                    {t.auto && <Badge tone="blue">auto</Badge>}
                    <Badge tone={label === "Overdue" ? "red" : "gray"}>{fmtDate(t.due)}</Badge>
                    <span className="hidden text-xs text-muted sm:inline">{t.owner}</span>
                  </span>
                </label>
              ))}
            </Card>
          </section>
        ))}
      </div>
    </>
  );
}
