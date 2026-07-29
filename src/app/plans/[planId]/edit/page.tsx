import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { PlanForm } from "@/components/PlanForm";
import { updatePlan } from "@/actions/plans";

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const session = await requireSession();

  const plan = await prisma.plan.findFirst({
    where: { id: planId, userId: session.user.id },
  });

  if (!plan) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-16">
      <h1 className="text-xl font-semibold">Edit plan</h1>
      <PlanForm
        action={updatePlan.bind(null, plan.id)}
        defaultValues={{ name: plan.name, description: plan.description }}
        submitLabel="Save changes"
      />
    </div>
  );
}
