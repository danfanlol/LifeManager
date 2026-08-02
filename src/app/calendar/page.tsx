import Link from "next/link";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getMonthGrid } from "@/lib/calendar";

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await requireSession();
  const timezone = (session.user as { timezone?: string }).timezone || "UTC";
  const now = DateTime.now().setZone(timezone);

  const { year: yearParam, month: monthParam } = await searchParams;
  const year = Number(yearParam) || now.year;
  const month = Number(monthParam) || now.month;

  const weeks = getMonthGrid(year, month, timezone);
  const gridStart = weeks[0][0].date;
  const gridEnd = weeks[weeks.length - 1][6].date;

  const logs = await prisma.hourLog.findMany({
    where: {
      userId: session.user.id,
      date: { gte: gridStart.toUTC().toJSDate(), lte: gridEnd.toUTC().toJSDate() },
    },
    select: { date: true },
  });
  const datesWithNotes = new Set(
    logs.map((log) => DateTime.fromJSDate(log.date, { zone: "utc" }).toISODate()),
  );

  const monthLabel = DateTime.fromObject({ year, month, day: 1 }).toFormat("MMMM yyyy");
  const prevMonth = DateTime.fromObject({ year, month, day: 1 }).minus({ months: 1 });
  const nextMonth = DateTime.fromObject({ year, month, day: 1 }).plus({ months: 1 });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Calendar</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href={`/calendar?year=${prevMonth.year}&month=${prevMonth.month}`}
            className="underline"
          >
            ← Prev
          </Link>
          <span className="font-medium">{monthLabel}</span>
          <Link
            href={`/calendar?year=${nextMonth.year}&month=${nextMonth.month}`}
            className="underline"
          >
            Next →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
        {WEEKDAY_HEADERS.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((day) => (
          <Link
            key={day.dateParam}
            href={`/calendar/${day.dateParam}`}
            className={`flex aspect-square flex-col items-center justify-center gap-1 rounded border text-sm ${
              day.isCurrentMonth
                ? "border-gray-200 dark:border-gray-800"
                : "border-transparent text-gray-300 dark:text-gray-700"
            } ${day.isToday ? "border-gray-900 font-semibold dark:border-white" : ""}`}
          >
            <span>{day.date.day}</span>
            {datesWithNotes.has(day.dateParam) && (
              <span className="h-1.5 w-1.5 rounded-full bg-gray-900 dark:bg-white" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
