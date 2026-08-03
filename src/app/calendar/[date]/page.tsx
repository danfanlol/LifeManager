import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { calendarDateToUtcMidnight, parseDateParam } from "@/lib/calendar";
import { HourLogList } from "@/components/HourLogList";

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
  const initialNotes = Object.fromEntries(logs.map((log) => [log.hour, log.note]));

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

      <HourLogList dateParam={dateParam} initialNotes={initialNotes} />
    </div>
  );
}
