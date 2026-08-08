import Link from "next/link";
import { toggleComplete, toggleMissed } from "@/actions/deadlines";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  RECURRENCE_LABELS,
  formatDueTime,
} from "@/lib/deadline-display";
import type { DeadlineStatus } from "@/lib/recurrence";

export function DeadlineCard({
  deadline,
  status,
}: {
  deadline: {
    id: string;
    title: string;
    description: string | null;
    recurrenceType: string;
    dueTime: string | null;
  };
  status: DeadlineStatus;
}) {
  const isDone = status.status === "done";
  const isMissed = status.status === "missed";
  const canToggleMissed = status.status === "overdue" || isMissed;

  return (
    <li className="group relative flex items-center justify-between gap-3 rounded border border-gray-200 px-4 py-3 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700">
      <Link
        href={`/deadlines/${deadline.id}`}
        className="absolute inset-0 z-0 rounded"
      >
        <span className="sr-only">{deadline.title}</span>
      </Link>

      <div>
        <p className="font-medium">{deadline.title}</p>
        {deadline.description && (
          <p className="text-sm text-gray-500">{deadline.description}</p>
        )}
        <p className={`text-xs ${STATUS_STYLES[status.status]}`}>
          {STATUS_LABELS[status.status]} · {RECURRENCE_LABELS[deadline.recurrenceType]}
          {deadline.dueTime && ` · ${formatDueTime(deadline.dueTime)}`}
        </p>
      </div>

      <div className="relative z-10 flex shrink-0 items-center gap-2">
        {canToggleMissed && (
          <form action={toggleMissed.bind(null, deadline.id)}>
            <button
              type="submit"
              className={`rounded border px-2 py-1.5 text-xs font-medium ${
                isMissed
                  ? "border-gray-400 text-gray-500 dark:border-gray-600"
                  : "border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
              }`}
            >
              {isMissed ? "Unmark missed" : "Mark missed"}
            </button>
          </form>
        )}
        <form action={toggleComplete.bind(null, deadline.id)}>
          <button
            type="submit"
            aria-label={isDone ? "Mark as not done" : "Mark as done"}
            className={`flex h-8 w-8 items-center justify-center rounded border ${
              isDone
                ? "border-green-600 bg-green-600"
                : "border-gray-400 dark:border-gray-600"
            }`}
          >
            {isDone && <span className="block text-base leading-none text-white">✓</span>}
          </button>
        </form>
      </div>
    </li>
  );
}
