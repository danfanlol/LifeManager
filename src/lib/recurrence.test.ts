import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import {
  getEffectiveAnchorDate,
  getDeadlineStatus,
  getNextAnchorDate,
  periodKeyFor,
} from "@/lib/recurrence";
import type { DeadlineRecurrence } from "@/lib/recurrence";

function base(overrides: Partial<DeadlineRecurrence>): DeadlineRecurrence {
  return {
    recurrenceType: "DAILY",
    dueDate: null,
    daysOfWeek: [],
    daysOfMonth: [],
    ...overrides,
  };
}

// ISO weekday (1=Mon..7=Sun) -> JS weekday (0=Sun..6=Sat)
const toJsWeekday = (isoWeekday: number) => isoWeekday % 7;

describe("getEffectiveAnchorDate", () => {
  it("NONE returns the due date itself", () => {
    const now = DateTime.fromISO("2026-07-29", { zone: "America/Los_Angeles" });
    const deadline = base({
      recurrenceType: "NONE",
      dueDate: new Date("2026-08-05T00:00:00.000Z"),
    });
    const anchor = getEffectiveAnchorDate(deadline, now);
    expect(anchor?.toISODate()).toBe("2026-08-05");
  });

  it("DAILY returns today", () => {
    const now = DateTime.fromISO("2026-07-29", { zone: "America/Los_Angeles" });
    const anchor = getEffectiveAnchorDate(base({ recurrenceType: "DAILY" }), now);
    expect(anchor?.toISODate()).toBe("2026-07-29");
  });

  it("WEEKLY resolves to today when today matches the anchor weekday", () => {
    const now = DateTime.fromISO("2026-07-29", { zone: "America/Los_Angeles" });
    const todayJsWeekday = toJsWeekday(now.weekday);
    const deadline = base({
      recurrenceType: "WEEKLY",
      daysOfWeek: [todayJsWeekday],
    });
    const anchor = getEffectiveAnchorDate(deadline, now);
    expect(anchor?.toISODate()).toBe("2026-07-29");
  });

  it("WEEKLY resolves to a past date when the anchor weekday already passed this week", () => {
    const now = DateTime.fromISO("2026-07-29", { zone: "America/Los_Angeles" });
    const twoDaysAgoJsWeekday = toJsWeekday(now.minus({ days: 2 }).weekday);
    const deadline = base({
      recurrenceType: "WEEKLY",
      daysOfWeek: [twoDaysAgoJsWeekday],
    });
    const anchor = getEffectiveAnchorDate(deadline, now);
    expect(anchor?.toISODate()).toBe(now.minus({ days: 2 }).toISODate());
  });

  it("MULTI_WEEKLY picks the most recent of two anchor days", () => {
    const now = DateTime.fromISO("2026-07-29", { zone: "America/Los_Angeles" });
    const todayJsWeekday = toJsWeekday(now.weekday);
    const fourDaysAgoJsWeekday = toJsWeekday(now.minus({ days: 4 }).weekday);
    const deadline = base({
      recurrenceType: "MULTI_WEEKLY",
      daysOfWeek: [todayJsWeekday, fourDaysAgoJsWeekday],
    });
    const anchor = getEffectiveAnchorDate(deadline, now);
    expect(anchor?.toISODate()).toBe("2026-07-29");
  });

  it("MULTI_WEEKLY picks the most recent across more than two anchor days", () => {
    const now = DateTime.fromISO("2026-07-29", { zone: "America/Los_Angeles" });
    const todayJsWeekday = toJsWeekday(now.weekday);
    const twoDaysAgoJsWeekday = toJsWeekday(now.minus({ days: 2 }).weekday);
    const fourDaysAgoJsWeekday = toJsWeekday(now.minus({ days: 4 }).weekday);
    const deadline = base({
      recurrenceType: "MULTI_WEEKLY",
      daysOfWeek: [todayJsWeekday, twoDaysAgoJsWeekday, fourDaysAgoJsWeekday],
    });
    const anchor = getEffectiveAnchorDate(deadline, now);
    expect(anchor?.toISODate()).toBe("2026-07-29");
  });

  it("MONTHLY resolves to this month's anchor day when it has already occurred", () => {
    const now = DateTime.fromISO("2026-07-29", { zone: "America/Los_Angeles" });
    const anchor = getEffectiveAnchorDate(
      base({ recurrenceType: "MONTHLY", daysOfMonth: [1] }),
      now,
    );
    expect(anchor?.toISODate()).toBe("2026-07-01");
  });

  it("MONTHLY clamps day 31 to the last day of a shorter month (February, non-leap)", () => {
    const now = DateTime.fromISO("2026-02-28", { zone: "America/Los_Angeles" });
    const anchor = getEffectiveAnchorDate(
      base({ recurrenceType: "MONTHLY", daysOfMonth: [31] }),
      now,
    );
    expect(anchor?.toISODate()).toBe("2026-02-28");
  });

  it("MONTHLY falls back to last month's clamped day before this month's anchor day arrives", () => {
    // July 29: day 31 hasn't happened yet this month, so falls back to June's
    // clamped day (June has 30 days).
    const now = DateTime.fromISO("2026-07-29", { zone: "America/Los_Angeles" });
    const anchor = getEffectiveAnchorDate(
      base({ recurrenceType: "MONTHLY", daysOfMonth: [31] }),
      now,
    );
    expect(anchor?.toISODate()).toBe("2026-06-30");
  });

  it("resolves consistently for a user far across the International Date Line", () => {
    const now = DateTime.fromISO("2026-07-29T23:30:00", { zone: "Pacific/Kiritimati" });
    const anchor = getEffectiveAnchorDate(base({ recurrenceType: "DAILY" }), now);
    expect(anchor?.toISODate()).toBe("2026-07-29");
  });
});

describe("getNextAnchorDate", () => {
  it("WEEKLY rolls over to next week once this week's day has passed", () => {
    const now = DateTime.fromISO("2026-07-29", { zone: "America/Los_Angeles" });
    const twoDaysAgoJsWeekday = toJsWeekday(now.minus({ days: 2 }).weekday);
    const deadline = base({
      recurrenceType: "WEEKLY",
      daysOfWeek: [twoDaysAgoJsWeekday],
    });
    const next = getNextAnchorDate(deadline, now);
    expect(next?.toISODate()).toBe(now.plus({ days: 5 }).toISODate());
  });

  it("MONTHLY returns next month's anchor when this month's has passed", () => {
    const now = DateTime.fromISO("2026-07-29", { zone: "America/Los_Angeles" });
    const next = getNextAnchorDate(
      base({ recurrenceType: "MONTHLY", daysOfMonth: [1] }),
      now,
    );
    expect(next?.toISODate()).toBe("2026-08-01");
  });
});

describe("periodKeyFor", () => {
  it("gives distinct keys for two occurrences of a MULTI_WEEKLY deadline in the same week", () => {
    const monday = DateTime.fromISO("2026-07-27", { zone: "utc" });
    const thursday = DateTime.fromISO("2026-07-30", { zone: "utc" });
    expect(periodKeyFor(monday)).not.toBe(periodKeyFor(thursday));
  });
});

describe("getDeadlineStatus", () => {
  it("is dueToday when not yet completed for the current period", () => {
    const now = DateTime.fromISO("2026-07-29", { zone: "America/Los_Angeles" });
    const status = getDeadlineStatus(
      {
        ...base({ recurrenceType: "DAILY" }),
        dueTime: null,
        lastCompletedPeriodKey: null,
        lastMissedPeriodKey: null,
      },
      now,
    );
    expect(status?.status).toBe("dueToday");
  });

  it("is done once lastCompletedPeriodKey matches the current period", () => {
    const now = DateTime.fromISO("2026-07-29", { zone: "America/Los_Angeles" });
    const status = getDeadlineStatus(
      {
        ...base({ recurrenceType: "DAILY" }),
        dueTime: null,
        lastCompletedPeriodKey: "2026-07-29",
        lastMissedPeriodKey: null,
      },
      now,
    );
    expect(status?.status).toBe("done");
  });

  it("is overdue when the anchor date is in the past and uncompleted", () => {
    const now = DateTime.fromISO("2026-07-29", { zone: "America/Los_Angeles" });
    const status = getDeadlineStatus(
      {
        ...base({ recurrenceType: "MONTHLY", daysOfMonth: [1] }),
        dueTime: null,
        lastCompletedPeriodKey: null,
        lastMissedPeriodKey: null,
      },
      now,
    );
    expect(status?.status).toBe("overdue");
    expect(status?.periodKey).toBe("2026-07-01");
  });

  it("a stale completion from a prior period does not mark the new period done", () => {
    const now = DateTime.fromISO("2026-07-30", { zone: "America/Los_Angeles" });
    const status = getDeadlineStatus(
      {
        ...base({ recurrenceType: "DAILY" }),
        dueTime: null,
        lastCompletedPeriodKey: "2026-07-29",
        lastMissedPeriodKey: null,
      },
      now,
    );
    expect(status?.status).toBe("dueToday");
  });

  it("is missed once lastMissedPeriodKey matches the current period", () => {
    const now = DateTime.fromISO("2026-07-29", { zone: "America/Los_Angeles" });
    const status = getDeadlineStatus(
      {
        ...base({ recurrenceType: "DAILY" }),
        dueTime: null,
        lastCompletedPeriodKey: null,
        lastMissedPeriodKey: "2026-07-29",
      },
      now,
    );
    expect(status?.status).toBe("missed");
  });

  it("a stale miss from a prior period does not mark the new period missed", () => {
    const now = DateTime.fromISO("2026-07-30", { zone: "America/Los_Angeles" });
    const status = getDeadlineStatus(
      {
        ...base({ recurrenceType: "DAILY" }),
        dueTime: null,
        lastCompletedPeriodKey: null,
        lastMissedPeriodKey: "2026-07-29",
      },
      now,
    );
    expect(status?.status).toBe("dueToday");
  });

  it("is dueToday when a due time exists but hasn't passed yet today", () => {
    const now = DateTime.fromISO("2026-07-29T11:32", { zone: "America/Los_Angeles" });
    const status = getDeadlineStatus(
      {
        ...base({ recurrenceType: "DAILY" }),
        dueTime: "20:07",
        lastCompletedPeriodKey: null,
        lastMissedPeriodKey: null,
      },
      now,
    );
    expect(status?.status).toBe("dueToday");
  });

  it("is overdue once today's due time has passed", () => {
    const now = DateTime.fromISO("2026-07-29T23:32", { zone: "America/Los_Angeles" });
    const status = getDeadlineStatus(
      {
        ...base({ recurrenceType: "DAILY" }),
        dueTime: "20:07",
        lastCompletedPeriodKey: null,
        lastMissedPeriodKey: null,
      },
      now,
    );
    expect(status?.status).toBe("overdue");
  });

  it("is overdue at the exact due time", () => {
    const now = DateTime.fromISO("2026-07-29T20:07", { zone: "America/Los_Angeles" });
    const status = getDeadlineStatus(
      {
        ...base({ recurrenceType: "DAILY" }),
        dueTime: "20:07",
        lastCompletedPeriodKey: null,
        lastMissedPeriodKey: null,
      },
      now,
    );
    expect(status?.status).toBe("overdue");
  });
});
