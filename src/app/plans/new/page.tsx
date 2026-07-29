import { PlanForm } from "@/components/PlanForm";
import { createPlan } from "@/actions/plans";

export default function NewPlanPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-16">
      <h1 className="text-xl font-semibold">New plan</h1>
      <PlanForm action={createPlan} submitLabel="Create plan" />
    </div>
  );
}
