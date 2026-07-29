"use client";

import { useActionState, useState } from "react";

type RecurrenceType = "NONE" | "DAILY" | "WEEKLY" | "MULTI_WEEKLY" | "MONTHLY";

type DeadlineFormState =
  | { errors?: Record<string, string[] | undefined> }
  | undefined;

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export function DeadlineForm({
  action,
  plans,
  defaultValues,
  submitLabel,
}: {
  action: (
    prevState: DeadlineFormState,
    formData: FormData,
  ) => Promise<DeadlineFormState>;
  plans: { id: string; name: string }[];
  defaultValues?: {
    title: string;
    description: string | null;
    recurrenceType: RecurrenceType;
    dueDate: string | null; // yyyy-MM-dd
    daysOfWeek: number[];
    daysOfMonth: number[];
    planId: string | null;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    defaultValues?.recurrenceType ?? "NONE",
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Title
        <input
          name="title"
          className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          defaultValue={defaultValues?.title}
          required
        />
        {state?.errors?.title && (
          <span className="text-sm text-red-600">{state.errors.title[0]}</span>
        )}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Description (optional)
        <textarea
          name="description"
          className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          defaultValue={defaultValues?.description ?? ""}
          rows={2}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Plan (optional)
        <select
          name="planId"
          className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          defaultValue={defaultValues?.planId ?? ""}
        >
          <option value="">No plan — standalone</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Repeats
        <select
          name="recurrenceType"
          className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          value={recurrenceType}
          onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
        >
          <option value="NONE">One time</option>
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
          <option value="MULTI_WEEKLY">Multiple days a week</option>
          <option value="MONTHLY">Monthly</option>
        </select>
      </label>

      {recurrenceType === "NONE" && (
        <label className="flex flex-col gap-1 text-sm">
          Due date
          <input
            type="date"
            name="dueDate"
            className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            defaultValue={defaultValues?.dueDate ?? ""}
            required
          />
          {state?.errors?.dueDate && (
            <span className="text-sm text-red-600">{state.errors.dueDate[0]}</span>
          )}
        </label>
      )}

      {(recurrenceType === "WEEKLY" || recurrenceType === "MULTI_WEEKLY") && (
        <fieldset className="flex flex-col gap-1 text-sm">
          <legend>
            {recurrenceType === "WEEKLY"
              ? "Which day of the week"
              : "Which days of the week (two or more)"}
          </legend>
          <div className="flex flex-wrap gap-3">
            {WEEKDAYS.map((day) => (
              <label key={day.value} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  name="daysOfWeek"
                  value={day.value}
                  defaultChecked={defaultValues?.daysOfWeek.includes(day.value)}
                />
                {day.label}
              </label>
            ))}
          </div>
          {state?.errors?.daysOfWeek && (
            <span className="text-sm text-red-600">{state.errors.daysOfWeek[0]}</span>
          )}
        </fieldset>
      )}

      {recurrenceType === "MONTHLY" && (
        <fieldset className="flex flex-col gap-1 text-sm">
          <legend>Which day of the month</legend>
          <p className="text-xs text-gray-500">
            If a chosen day doesn&apos;t exist in a given month, it falls on
            the last day of that month instead.
          </p>
          <div className="flex flex-wrap gap-3">
            {MONTH_DAYS.map((day) => (
              <label key={day} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  name="daysOfMonth"
                  value={day}
                  defaultChecked={defaultValues?.daysOfMonth.includes(day)}
                />
                {day}
              </label>
            ))}
          </div>
          {state?.errors?.daysOfMonth && (
            <span className="text-sm text-red-600">
              {state.errors.daysOfMonth[0]}
            </span>
          )}
        </fieldset>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-gray-900"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
