import { requireSession } from "@/lib/session";
import { TimezoneForm } from "@/components/TimezoneForm";
import { PushSubscribeButton } from "@/components/PushSubscribeButton";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function SettingsPage() {
  const session = await requireSession();
  const timezone = (session.user as { timezone?: string }).timezone || "UTC";

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-4 py-16">
      <h1 className="text-xl font-semibold">Settings</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-gray-500">Appearance</h2>
        <p className="text-sm text-gray-500">Choose how LifeManager looks on this device.</p>
        <ThemeToggle />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-gray-500">Timezone</h2>
        <p className="text-sm text-gray-500">
          Used to figure out what &quot;due today&quot; means for you.
        </p>
        <TimezoneForm currentTimezone={timezone} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-gray-500">Notifications</h2>
        <p className="text-sm text-gray-500">
          Get a browser push notification when something is due or overdue.
        </p>
        <PushSubscribeButton />
      </section>
    </div>
  );
}
