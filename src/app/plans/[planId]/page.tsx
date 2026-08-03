import Link from "next/link";
import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { withStatus } from "@/lib/recurrence";
import { DeadlineCard } from "@/components/DeadlineCard";
import { DeleteButton } from "@/components/DeleteButton";
import { deletePlan, resolvePlan, unresolvePlan } from "@/actions/plans";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const session = await requireSession();

  const plan = await prisma.plan.findFirst({
    where: { id: planId, userId: session.user.id },
    include: { deadlines: { orderBy: { createdAt: "asc" } } },
  });

  if (!plan) {
    notFound();
  }

  const timezone = (session.user as { timezone?: string }).timezone || "UTC";
  const now = DateTime.now().setZone(timezone);
  const entries = withStatus(plan.deadlines, now);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-16">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{plan.name}</h1>
          {plan.description && (
            <p className="text-sm text-gray-500">{plan.description}</p>
          )}
          {plan.resolvedAt && (
            <p className="text-xs text-gray-400">Resolved</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/plans/${plan.id}/edit`} className="text-sm underline">
            Edit
          </Link>
          <form action={(plan.resolvedAt ? unresolvePlan : resolvePlan).bind(null, plan.id)}>
            <button type="submit" className="text-sm underline">
              {plan.resolvedAt ? "Unresolve" : "Resolve"}
            </button>
          </form>
          <DeleteButton
            action={deletePlan.bind(null, plan.id)}
            confirmMessage={`Delete "${plan.name}" and remove it from its deadlines?`}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-500">Deadlines</h2>
        <Link
          href={`/deadlines/new?planId=${plan.id}`}
          className="rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-gray-900"
        >
          Add deadline
        </Link>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">No deadlines in this plan yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map(({ deadline, status }) => (
            <DeadlineCard key={deadline.id} deadline={deadline} status={status} />
          ))}
        </ul>
      )}

      <Link href="/plans" className="text-sm underline">
        ← Back to plans
      </Link>
    </div>
  );
}
