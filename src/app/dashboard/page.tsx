import Link from "next/link";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { withStatus, getNextAnchorDate } from "@/lib/recurrence";
import type { DeadlineRecurrence, DeadlineStatus } from "@/lib/recurrence";
import { DeadlineCard } from "@/components/DeadlineCard";

type DeadlineWithPlan = DeadlineRecurrence & {
  id: string;
  title: string;
  description: string | null;
  lastCompletedPeriodKey: string | null;
  plan: { id: string; name: string } | null;
};

type Entry = { deadline: DeadlineWithPlan; status: DeadlineStatus };

function groupByPlan(entries: Entry[]) {
  const standalone: Entry[] = [];
  const byPlan = new Map<string, { name: string; entries: Entry[] }>();

  for (const entry of entries) {
    const plan = entry.deadline.plan;
    if (!plan) {
      standalone.push(entry);
      continue;
    }
    if (!byPlan.has(plan.id)) {
      byPlan.set(plan.id, { name: plan.name, entries: [] });
    }
    byPlan.get(plan.id)!.entries.push(entry);
  }

  return { standalone, byPlan };
}

function Section({ title, entries }: { title: string; entries: Entry[] }) {
  if (entries.length === 0) return null;

  const { standalone, byPlan } = groupByPlan(entries);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{title}</h2>

      {standalone.length > 0 && (
        <ul className="flex flex-col gap-2">
          {standalone.map(({ deadline, status }) => (
            <DeadlineCard key={deadline.id} deadline={deadline} status={status} />
          ))}
        </ul>
      )}

      {[...byPlan.entries()].map(([planId, group]) => (
        <div key={planId} className="flex flex-col gap-2">
          <Link
            href={`/plans/${planId}`}
            className="text-xs font-medium uppercase tracking-wide text-gray-400 hover:underline"
          >
            {group.name}
          </Link>
          <ul className="flex flex-col gap-2">
            {group.entries.map(({ deadline, status }) => (
              <DeadlineCard key={deadline.id} deadline={deadline} status={status} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export default async function DashboardPage() {
  const session = await requireSession();
  const timezone = (session.user as { timezone?: string }).timezone || "UTC";
  const now = DateTime.now().setZone(timezone);

  const deadlines = await prisma.deadline.findMany({
    where: { userId: session.user.id, isActive: true },
    include: { plan: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const entries: Entry[] = withStatus(deadlines, now);

  const overdue = entries.filter((e) => e.status.status === "overdue");
  const dueToday = entries.filter((e) => e.status.status === "dueToday");

  // One-time deadlines completed, or due in the future, resolve directly to
  // "done"/"upcoming" from getDeadlineStatus. Recurring deadlines already
  // done for their current period instead surface their *next* occurrence
  // here, rather than sitting inert in "Done" until the period rolls over.
  const doneOneTime = entries.filter(
    (e) => e.status.status === "done" && e.deadline.recurrenceType === "NONE",
  );
  const upcomingOneTime = entries.filter((e) => e.status.status === "upcoming");
  const upcomingRecurring: Entry[] = entries
    .filter((e) => e.status.status === "done" && e.deadline.recurrenceType !== "NONE")
    .flatMap((e) => {
      const next = getNextAnchorDate(e.deadline, now);
      if (!next) return [];
      return [{ deadline: e.deadline, status: { status: "upcoming" as const, periodKey: next.toISODate()!, anchorDate: next } }];
    });

  const upcoming = [...upcomingOneTime, ...upcomingRecurring]
    .filter((e) => e.status.anchorDate <= now.plus({ days: 7 }))
    .sort((a, b) => a.status.anchorDate.toMillis() - b.status.anchorDate.toMillis());

  const hasAnything = deadlines.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link
          href="/deadlines/new"
          className="rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-gray-900"
        >
          New deadline
        </Link>
      </div>

      {!hasAnything && (
        <p className="text-sm text-gray-500">
          Nothing tracked yet.{" "}
          <Link href="/deadlines/new" className="underline">
            Add your first deadline
          </Link>{" "}
          or{" "}
          <Link href="/plans/new" className="underline">
            create a plan
          </Link>
          .
        </p>
      )}

      <Section title="Overdue" entries={overdue} />
      <Section title="Due today" entries={dueToday} />
      <Section title="Upcoming (next 7 days)" entries={upcoming} />
      <Section title="Done" entries={doneOneTime} />
    </div>
  );
}
