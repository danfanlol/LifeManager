"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveHourNote } from "@/actions/calendar";
import { formatHourLabel } from "@/lib/calendar";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SAVE_DELAY_MS = 800;

type RowStatus = "idle" | "dirty" | "saving" | "saved" | "error";

const STATUS_TEXT: Record<RowStatus, string> = {
  idle: "",
  dirty: "Unsaved",
  saving: "Saving…",
  saved: "Saved",
  error: "Couldn't save — will retry",
};

export function HourLogList({
  dateParam,
  initialNotes,
}: {
  dateParam: string;
  initialNotes: Record<number, string>;
}) {
  const [values, setValues] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    for (const hour of HOURS) initial[hour] = initialNotes[hour] ?? "";
    return initial;
  });
  const [statuses, setStatuses] = useState<Record<number, RowStatus>>({});

  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const pendingHours = useRef<Set<number>>(new Set());

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (pendingHours.current.size > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const save = useCallback(
    async (hour: number, note: string) => {
      setStatuses((s) => ({ ...s, [hour]: "saving" }));
      try {
        await saveHourNote(dateParam, hour, note);
        pendingHours.current.delete(hour);
        setStatuses((s) => ({ ...s, [hour]: "saved" }));
      } catch {
        // Left in pendingHours so the unload warning still fires; the next
        // debounced edit (or blur) will retry the save.
        setStatuses((s) => ({ ...s, [hour]: "error" }));
      }
    },
    [dateParam],
  );

  function scheduleSave(hour: number, note: string) {
    pendingHours.current.add(hour);
    setStatuses((s) => ({ ...s, [hour]: "dirty" }));
    clearTimeout(timers.current[hour]);
    timers.current[hour] = setTimeout(() => save(hour, note), SAVE_DELAY_MS);
  }

  function flushSave(hour: number) {
    clearTimeout(timers.current[hour]);
    if (pendingHours.current.has(hour)) {
      save(hour, values[hour]);
    }
  }

  return (
    <ul className="flex flex-col divide-y divide-gray-200 dark:divide-gray-800">
      {HOURS.map((hour) => (
        <li key={hour} className="flex items-center gap-3 py-2">
          <span className="w-20 shrink-0 text-sm text-gray-500">
            {formatHourLabel(hour)}
          </span>
          <input
            type="text"
            value={values[hour]}
            placeholder="What did you do?"
            onChange={(e) => {
              const note = e.target.value;
              setValues((v) => ({ ...v, [hour]: note }));
              scheduleSave(hour, note);
            }}
            onBlur={() => flushSave(hour)}
            className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          <span
            className={`w-32 shrink-0 text-xs ${
              statuses[hour] === "error" ? "text-red-600" : "text-gray-400"
            }`}
          >
            {STATUS_TEXT[statuses[hour] ?? "idle"]}
          </span>
        </li>
      ))}
    </ul>
  );
}
