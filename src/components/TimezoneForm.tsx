"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

// A reasonably complete list would be huge; offer common IANA zones plus
// whatever the browser detects so the current value always has an option.
const COMMON_TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export function TimezoneForm({ currentTimezone }: { currentTimezone: string }) {
  const router = useRouter();
  const [timezone, setTimezone] = useState(currentTimezone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const options = COMMON_TIMEZONES.includes(currentTimezone)
    ? COMMON_TIMEZONES
    : [currentTimezone, ...COMMON_TIMEZONES];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    // @ts-expect-error -- additionalFields aren't reflected in the base type
    await authClient.updateUser({ timezone });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <select
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
        className="rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
      >
        {options.map((tz) => (
          <option key={tz} value={tz}>
            {tz}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-gray-900"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      {saved && <span className="text-sm text-green-600">Saved</span>}
    </form>
  );
}
