import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export async function NavBar() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) return null;

  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="font-medium">
            LifeManager
          </Link>
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
            Dashboard
          </Link>
          <Link href="/plans" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
            Plans
          </Link>
          <Link href="/settings" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
            Settings
          </Link>
        </nav>
        <LogoutButton />
      </div>
    </header>
  );
}
