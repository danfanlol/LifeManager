import Link from "next/link";
import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { calendarDateToUtcMidnight, formatHourLabel, parseDateParam } from "@/lib/calendar";
import { saveHourNote } from "@/actions/calendar";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default async function CalendarDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date: dateParam } = await params;
  const session = await requireSession();
  const timezone = (session.user as { timezone?: string }).timezone || "UTC";

  const day = parseDateParam(dateParam, timezone);
  if (!day) {
    notFound();
  }

  const logs = await prisma.hourLog.findMany({
    where: { userId: session.user.id, date: calendarDateToUtcMidnight(dateParam) },
  });
  const noteByHour = new Map(logs.map((log) => [log.hour, log.note]));

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{day.toFormat("EEEE, MMMM d, yyyy")}</h1>
        <Link
          href={`/calendar?year=${day.year}&month=${day.month}`}
          className="text-sm underline"
        >
          ← Back to calendar
        </Link>
      </div>

      <ul className="flex flex-col divide-y divide-gray-200 dark:divide-gray-800">
        {HOURS.map((hour) => (
          <li key={hour} className="flex items-center gap-3 py-2">
            <span className="w-20 shrink-0 text-sm text-gray-500">
              {formatHourLabel(hour)}
            </span>
            <form
              action={saveHourNote.bind(null, dateParam, hour)}
              className="flex flex-1 items-center gap-2"
            >
              <input
                type="text"
                name="note"
                defaultValue={noteByHour.get(hour) ?? ""}
                placeholder="What did you do?"
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
              <button
                type="submit"
                className="shrink-0 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-700"
              >
                Save
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
