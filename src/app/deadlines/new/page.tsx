import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { DeadlineForm } from "@/components/DeadlineForm";
import { createDeadline } from "@/actions/deadlines";

export default async function NewDeadlinePage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string }>;
}) {
  const { planId } = await searchParams;
  const session = await requireSession();

  const plans = await prisma.plan.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-16">
      <h1 className="text-xl font-semibold">New deadline</h1>
      <DeadlineForm
        action={createDeadline}
        plans={plans}
        submitLabel="Create deadline"
        defaultValues={
          planId
            ? {
                title: "",
                description: "",
                recurrenceType: "NONE",
                dueDate: null,
                dueTime: null,
                daysOfWeek: [],
                daysOfMonth: [],
                planId,
              }
            : undefined
        }
      />
    </div>
  );
}
