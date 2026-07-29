"use client";

import { useActionState } from "react";

type PlanFormState = { errors?: Record<string, string[] | undefined> } | undefined;

export function PlanForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: PlanFormState, formData: FormData) => Promise<PlanFormState>;
  defaultValues?: { name: string; description: string | null };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          name="name"
          className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          defaultValue={defaultValues?.name}
          required
        />
        {state?.errors?.name && (
          <span className="text-sm text-red-600">{state.errors.name[0]}</span>
        )}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Description (optional)
        <textarea
          name="description"
          className="rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          defaultValue={defaultValues?.description ?? ""}
          rows={3}
        />
      </label>

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
