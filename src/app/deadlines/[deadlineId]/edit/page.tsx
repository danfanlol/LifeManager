import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { DeadlineForm } from "@/components/DeadlineForm";
import { updateDeadline } from "@/actions/deadlines";

export default async function EditDeadlinePage({
  params,
}: {
  params: Promise<{ deadlineId: string }>;
}) {
  const { deadlineId } = await params;
  const session = await requireSession();

  const [deadline, plans] = await Promise.all([
    prisma.deadline.findFirst({
      where: { id: deadlineId, userId: session.user.id },
    }),
    prisma.plan.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!deadline) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-16">
      <h1 className="text-xl font-semibold">Edit deadline</h1>
      <DeadlineForm
        action={updateDeadline.bind(null, deadline.id)}
        plans={plans}
        submitLabel="Save changes"
        defaultValues={{
          title: deadline.title,
          description: deadline.description,
          recurrenceType: deadline.recurrenceType,
          dueDate: deadline.dueDate
            ? DateTime.fromJSDate(deadline.dueDate, { zone: "utc" }).toISODate()
            : null,
          daysOfWeek: deadline.daysOfWeek,
          daysOfMonth: deadline.daysOfMonth,
          planId: deadline.planId,
        }}
      />
    </div>
  );
}
