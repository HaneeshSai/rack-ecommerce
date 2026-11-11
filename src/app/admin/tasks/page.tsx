import { PageTitle } from "@/components/ui";
import { requireStaff } from "@/lib/session";
import { mock } from "@/lib/db";
import { TaskList } from "@/components/admin/task-list";

export default async function AdminTasks() {
  const user = await requireStaff("tasks");
  const S = mock.S();
  const tasks = S.tasks.map((t) => ({ id: t.id, title: t.title, due: t.due.toISOString(), done: t.done, owner: t.owner, auto: t.auto }));
  const owners = [...new Set(S.users.filter((u) => u.role !== "CUSTOMER" && u.role !== "DEALER").map((u) => u.name))];
  return (
    <>
      <PageTitle title="Tasks and follow-ups" sub="Call-backs, samples, payment chasing. Automatic tasks are created by the system." />
      <TaskList initial={tasks} owners={owners} me={user.name} now={new Date().toISOString()} />
    </>
  );
}
