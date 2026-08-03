import Link from "next/link";
import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getDeadlineStatus } from "@/lib/recurrence";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  formatRecurrenceDetail,
  formatDueDate,
  formatDueTime,
} from "@/lib/deadline-display";
import { toggleComplete, deleteDeadline } from "@/actions/deadlines";
import { DeleteButton } from "@/components/DeleteButton";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ deadlineId: string }>;
}) {
  const { deadlineId } = await params;
  const session = await requireSession();

  const deadline = await prisma.deadline.findFirst({
    where: { id: deadlineId, userId: session.user.id },
    include: { plan: { select: { id: true, name: true } } },
  });

  if (!deadline) {
    notFound();
  }

  const timezone = (session.user as { timezone?: string }).timezone || "UTC";
  const now = DateTime.now().setZone(timezone);
  const status = getDeadlineStatus(deadline, now);
  const isDone = status?.status === "done";

  const backHref = deadline.plan ? `/plans/${deadline.plan.id}` : "/dashboard";
  const backLabel = deadline.plan ? `Back to ${deadline.plan.name}` : "Back to dashboard";

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-16">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <form action={toggleComplete.bind(null, deadline.id)}>
            <button
              type="submit"
              aria-label={isDone ? "Mark as not done" : "Mark as done"}
              className={`mt-1 h-6 w-6 shrink-0 rounded border ${
                isDone
                  ? "border-green-600 bg-green-600"
                  : "border-gray-400 dark:border-gray-600"
              }`}
            >
              {isDone && <span className="block text-sm leading-none text-white">✓</span>}
            </button>
          </form>
          <div>
            <h1 className="text-xl font-semibold">{deadline.title}</h1>
            {status && (
              <p className={`text-sm ${STATUS_STYLES[status.status]}`}>
                {STATUS_LABELS[status.status]}
              </p>
            )}
          </div>
        </div>
      </div>

      {deadline.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300">{deadline.description}</p>
      )}

      <div className="flex flex-col gap-1 rounded border border-gray-200 px-4 py-3 text-sm dark:border-gray-800">
        <p className="text-gray-500">
          {deadline.recurrenceType === "NONE" && deadline.dueDate
            ? `Due ${formatDueDate(deadline.dueDate)}`
            : formatRecurrenceDetail(deadline)}
          {deadline.dueTime && ` at ${formatDueTime(deadline.dueTime)}`}
        </p>
        {deadline.plan && (
          <p className="text-gray-500">
            Part of{" "}
            <Link href={`/plans/${deadline.plan.id}`} className="underline">
              {deadline.plan.name}
            </Link>
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Link href={`/deadlines/${deadline.id}/edit`} className="text-sm underline">
          Edit
        </Link>
        <DeleteButton
          action={deleteDeadline.bind(null, deadline.id)}
          confirmMessage={`Delete "${deadline.title}"?`}
        />
      </div>

      <Link href={backHref} className="text-sm underline">
        ← {backLabel}
      </Link>
    </div>
  );
}
