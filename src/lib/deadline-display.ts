import { DateTime } from "luxon";
import type { DeadlineStatus } from "@/lib/recurrence";

export const STATUS_STYLES: Record<DeadlineStatus["status"], string> = {
  overdue: "text-red-600",
  dueToday: "text-amber-600",
  upcoming: "text-gray-500",
  done: "text-green-600",
};

export const STATUS_LABELS: Record<DeadlineStatus["status"], string> = {
  overdue: "Overdue",
  dueToday: "Due today",
  upcoming: "Upcoming",
  done: "Done",
};

export const RECURRENCE_LABELS: Record<string, string> = {
  NONE: "One time",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MULTI_WEEKLY: "Multiple days a week",
  MONTHLY: "Monthly",
};

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function ordinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const mod100 = n % 100;
  const suffix = suffixes[(mod100 - 20) % 10] ?? suffixes[mod100] ?? suffixes[0];
  return `${n}${suffix}`;
}

/** A short human-readable description of a deadline's recurrence rule. */
export function formatRecurrenceDetail(deadline: {
  recurrenceType: string;
  daysOfWeek: number[];
  daysOfMonth: number[];
  dueDate: Date | null;
}): string {
  switch (deadline.recurrenceType) {
    case "DAILY":
      return "Repeats every day";
    case "WEEKLY":
    case "MULTI_WEEKLY": {
      const names = deadline.daysOfWeek.map((d) => WEEKDAY_NAMES[d]).join(", ");
      return `Repeats weekly on ${names}`;
    }
    case "MONTHLY": {
      const names = deadline.daysOfMonth.map(ordinal).join(", ");
      return `Repeats monthly on the ${names}`;
    }
    default:
      return "One-time deadline";
  }
}

/** Formats a `dueDate` (stored as UTC midnight of a calendar date) for display. */
export function formatDueDate(dueDate: Date): string {
  return DateTime.fromJSDate(dueDate, { zone: "utc" }).toFormat("MMMM d, yyyy");
}

/** Formats a `dueTime` ("HH:mm" wall-clock string) for display, e.g. "2:30 PM". */
export function formatDueTime(dueTime: string): string {
  return DateTime.fromFormat(dueTime, "HH:mm").toFormat("h:mm a");
}
