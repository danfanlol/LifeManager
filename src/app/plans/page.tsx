import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export default async function PlansPage() {
  const session = await requireSession();

  const plans = await prisma.plan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { deadlines: true } } },
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Plans</h1>
        <Link
          href="/plans/new"
          className="rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-gray-900"
        >
          New plan
        </Link>
      </div>

      {plans.length === 0 ? (
        <p className="text-sm text-gray-500">
          No plans yet. Group related deadlines — like a study-abroad
          application — under a plan.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {plans.map((plan) => (
            <li key={plan.id}>
              <Link
                href={`/plans/${plan.id}`}
                className="flex items-center justify-between rounded border border-gray-200 px-4 py-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
              >
                <span className="font-medium">{plan.name}</span>
                <span className="text-sm text-gray-500">
                  {plan._count.deadlines} deadline
                  {plan._count.deadlines === 1 ? "" : "s"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
