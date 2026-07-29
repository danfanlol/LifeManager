import Link from "next/link";
import { toggleComplete, deleteDeadline } from "@/actions/deadlines";
import { DeleteButton } from "@/components/DeleteButton";
import type { DeadlineStatus } from "@/lib/recurrence";

const STATUS_STYLES: Record<DeadlineStatus["status"], string> = {
  overdue: "text-red-600",
  dueToday: "text-amber-600",
  upcoming: "text-gray-500",
  done: "text-green-600",
};

const STATUS_LABELS: Record<DeadlineStatus["status"], string> = {
  overdue: "Overdue",
  dueToday: "Due today",
  upcoming: "Upcoming",
  done: "Done",
};

const RECURRENCE_LABELS: Record<string, string> = {
  NONE: "One time",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MULTI_WEEKLY: "Multiple days a week",
  MONTHLY: "Monthly",
};

export function DeadlineCard({
  deadline,
  status,
}: {
  deadline: {
    id: string;
    title: string;
    description: string | null;
    recurrenceType: string;
  };
  status: DeadlineStatus;
}) {
  const isDone = status.status === "done";

  return (
    <li className="flex items-start justify-between gap-3 rounded border border-gray-200 px-4 py-3 dark:border-gray-800">
      <div className="flex items-start gap-3">
        <form action={toggleComplete.bind(null, deadline.id)}>
          <button
            type="submit"
            aria-label={isDone ? "Mark as not done" : "Mark as done"}
            className={`mt-0.5 h-5 w-5 shrink-0 rounded border ${
              isDone
                ? "border-green-600 bg-green-600"
                : "border-gray-400 dark:border-gray-600"
            }`}
          >
            {isDone && (
              <span className="block text-xs leading-none text-white">✓</span>
            )}
          </button>
        </form>

        <div>
          <p className="font-medium">{deadline.title}</p>
          {deadline.description && (
            <p className="text-sm text-gray-500">{deadline.description}</p>
          )}
          <p className={`text-xs ${STATUS_STYLES[status.status]}`}>
            {STATUS_LABELS[status.status]} · {RECURRENCE_LABELS[deadline.recurrenceType]}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <Link href={`/deadlines/${deadline.id}/edit`} className="text-sm underline">
          Edit
        </Link>
        <DeleteButton
          action={deleteDeadline.bind(null, deadline.id)}
          confirmMessage={`Delete "${deadline.title}"?`}
        />
      </div>
    </li>
  );
}
