import { DateTime } from "luxon";

export type CalendarDay = {
  date: DateTime;
  dateParam: string; // yyyy-MM-dd
  isCurrentMonth: boolean;
  isToday: boolean;
};

/**
 * A full-weeks grid (Sun-Sat rows) covering the given month, padded with
 * leading/trailing days from adjacent months so every week is complete.
 */
export function getMonthGrid(year: number, month: number, zone: string): CalendarDay[][] {
  const today = DateTime.now().setZone(zone).startOf("day");
  const firstOfMonth = DateTime.fromObject({ year, month, day: 1 }, { zone }).startOf("day");
  const gridStart = firstOfMonth.minus({ days: firstOfMonth.weekday % 7 });

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const date = gridStart.plus({ days: i });
    days.push({
      date,
      dateParam: date.toISODate()!,
      isCurrentMonth: date.month === month && date.year === year,
      isToday: date.equals(today),
    });
  }

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export function parseDateParam(dateParam: string, zone: string): DateTime | null {
  const date = DateTime.fromISO(dateParam, { zone }).startOf("day");
  return date.isValid ? date : null;
}

/** `date` is a calendar date stored as UTC midnight — a date, not an instant. */
export function calendarDateToUtcMidnight(dateParam: string): Date {
  return DateTime.fromISO(dateParam, { zone: "utc" }).startOf("day").toJSDate();
}

export function formatHourLabel(hour: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}
