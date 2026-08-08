import { DateTime } from "luxon";
import type { RecurrenceType } from "@/generated/prisma";

export type DeadlineRecurrence = {
  recurrenceType: RecurrenceType;
  dueDate: Date | null;
  daysOfWeek: number[];
  daysOfMonth: number[];
};

export type DeadlineStatus = {
  status: "done" | "dueToday" | "overdue" | "upcoming" | "missed";
  periodKey: string;
  anchorDate: DateTime;
};

/**
 * `dueDate` represents a calendar date, not an instant — it's stored as UTC
 * midnight of the chosen date. Re-derive the same y/m/d in the user's zone
 * rather than converting the instant across zones (which would shift it to
 * the previous day for any timezone behind UTC).
 */
function calendarDateInZone(date: Date, zone: string): DateTime {
  const utc = DateTime.fromJSDate(date, { zone: "utc" });
  return DateTime.fromObject(
    { year: utc.year, month: utc.month, day: utc.day },
    { zone },
  );
}

/** Clamp a target day-of-month to the last real day of that month. */
function clampToMonth(monthDate: DateTime, dayOfMonth: number): DateTime {
  const lastDayOfMonth = monthDate.endOf("month").day;
  return monthDate.set({ day: Math.min(dayOfMonth, lastDayOfMonth) }).startOf("day");
}

/** Most recent date on/before `today` that falls on the given JS weekday (0=Sun..6=Sat). */
function mostRecentWeekday(today: DateTime, jsWeekday: number): DateTime {
  // Luxon's `.weekday` is ISO (1=Mon..7=Sun); convert from JS convention (0=Sun..6=Sat).
  const isoWeekday = jsWeekday === 0 ? 7 : jsWeekday;
  const diff = (today.weekday - isoWeekday + 7) % 7;
  return today.minus({ days: diff });
}

/** Whether `now` is at or past the deadline's `dueTime` ("HH:mm") on its anchor date. */
function isPastDueTime(anchorDate: DateTime, dueTime: string | null, now: DateTime): boolean {
  if (!dueTime) return false;
  const [hour, minute] = dueTime.split(":").map(Number);
  const anchorDateTime = anchorDate.set({ hour, minute, second: 0, millisecond: 0 });
  return now >= anchorDateTime;
}

/**
 * The most recent occurrence (<= today) implied by a deadline's recurrence
 * rule, expressed as a date in the user's own timezone. This is the single
 * source of truth "is this due" logic is built on for every recurrence type.
 */
export function getEffectiveAnchorDate(
  deadline: DeadlineRecurrence,
  nowInUserTz: DateTime,
): DateTime | null {
  const today = nowInUserTz.startOf("day");

  switch (deadline.recurrenceType) {
    case "NONE": {
      if (!deadline.dueDate) return null;
      return calendarDateInZone(deadline.dueDate, nowInUserTz.zone.name);
    }

    case "DAILY":
      return today;

    case "WEEKLY":
    case "MULTI_WEEKLY": {
      const candidates = deadline.daysOfWeek
        .map((dow) => mostRecentWeekday(today, dow))
        .filter((d) => d <= today);
      if (candidates.length === 0) return null;
      return DateTime.max(...candidates) ?? null;
    }

    case "MONTHLY": {
      const candidates = deadline.daysOfMonth
        .flatMap((dom) => [
          clampToMonth(today.minus({ months: 1 }), dom),
          clampToMonth(today, dom),
        ])
        .filter((d) => d <= today);
      if (candidates.length === 0) return null;
      return DateTime.max(...candidates) ?? null;
    }

    default:
      return null;
  }
}

/**
 * The next occurrence (> today) implied by a deadline's recurrence rule.
 * Used for the dashboard's "Upcoming" section.
 */
export function getNextAnchorDate(
  deadline: DeadlineRecurrence,
  nowInUserTz: DateTime,
): DateTime | null {
  const today = nowInUserTz.startOf("day");

  switch (deadline.recurrenceType) {
    case "NONE": {
      if (!deadline.dueDate) return null;
      const due = calendarDateInZone(deadline.dueDate, nowInUserTz.zone.name);
      return due > today ? due : null;
    }

    case "DAILY":
      return today.plus({ days: 1 });

    case "WEEKLY":
    case "MULTI_WEEKLY": {
      const candidates = deadline.daysOfWeek.map((dow) => {
        const recent = mostRecentWeekday(today, dow);
        return recent > today ? recent : recent.plus({ weeks: 1 });
      });
      if (candidates.length === 0) return null;
      return DateTime.min(...candidates) ?? null;
    }

    case "MONTHLY": {
      const candidates = deadline.daysOfMonth.flatMap((dom) => [
        clampToMonth(today, dom),
        clampToMonth(today.plus({ months: 1 }), dom),
      ]);
      const future = candidates.filter((d) => d > today);
      if (future.length === 0) return null;
      return DateTime.min(...future) ?? null;
    }

    default:
      return null;
  }
}

export function periodKeyFor(anchorDate: DateTime): string {
  return anchorDate.toISODate()!;
}

export function getDeadlineStatus(
  deadline: DeadlineRecurrence & {
    dueTime: string | null;
    lastCompletedPeriodKey: string | null;
    lastMissedPeriodKey: string | null;
  },
  nowInUserTz: DateTime,
): DeadlineStatus | null {
  const anchorDate = getEffectiveAnchorDate(deadline, nowInUserTz);
  if (!anchorDate) return null;

  const today = nowInUserTz.startOf("day");
  const periodKey = periodKeyFor(anchorDate);
  const isCompleted = deadline.lastCompletedPeriodKey === periodKey;
  const isMissed = deadline.lastMissedPeriodKey === periodKey;

  let status: DeadlineStatus["status"];
  if (isCompleted) {
    status = "done";
  } else if (isMissed) {
    status = "missed";
  } else if (anchorDate < today) {
    status = "overdue";
  } else if (anchorDate.equals(today)) {
    // A due time that has already passed today tips it into overdue rather
    // than sitting in "due today" until midnight.
    status = isPastDueTime(anchorDate, deadline.dueTime, nowInUserTz) ? "overdue" : "dueToday";
  } else {
    status = "upcoming";
  }

  return { status, periodKey, anchorDate };
}

/** Attach a computed status to each deadline, dropping any with no resolvable anchor. */
export function withStatus<
  T extends DeadlineRecurrence & {
    id: string;
    title: string;
    description: string | null;
    dueTime: string | null;
    lastCompletedPeriodKey: string | null;
    lastMissedPeriodKey: string | null;
  },
>(deadlines: T[], nowInUserTz: DateTime): { deadline: T; status: DeadlineStatus }[] {
  return deadlines
    .map((deadline) => ({ deadline, status: getDeadlineStatus(deadline, nowInUserTz) }))
    .filter(
      (entry): entry is { deadline: T; status: DeadlineStatus } => entry.status !== null,
    );
}
