"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { planSchema } from "@/lib/validation";

export async function createPlan(_prevState: unknown, formData: FormData) {
  const session = await requireSession();

  const parsed = planSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const plan = await prisma.plan.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      userId: session.user.id,
    },
  });

  revalidatePath("/plans");
  redirect(`/plans/${plan.id}`);
}

export async function updatePlan(
  planId: string,
  _prevState: unknown,
  formData: FormData,
) {
  const session = await requireSession();

  const parsed = planSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.plan.updateMany({
    where: { id: planId, userId: session.user.id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
    },
  });

  revalidatePath("/plans");
  revalidatePath(`/plans/${planId}`);
  redirect(`/plans/${planId}`);
}

export async function deletePlan(planId: string) {
  const session = await requireSession();

  await prisma.plan.deleteMany({
    where: { id: planId, userId: session.user.id },
  });

  revalidatePath("/plans");
  redirect("/plans");
}

export async function resolvePlan(planId: string) {
  const session = await requireSession();

  await prisma.plan.updateMany({
    where: { id: planId, userId: session.user.id },
    data: { resolvedAt: new Date() },
  });

  revalidatePath("/plans");
  revalidatePath(`/plans/${planId}`);
  revalidatePath("/dashboard");
}

export async function unresolvePlan(planId: string) {
  const session = await requireSession();

  await prisma.plan.updateMany({
    where: { id: planId, userId: session.user.id },
    data: { resolvedAt: null },
  });

  revalidatePath("/plans");
  revalidatePath(`/plans/${planId}`);
  revalidatePath("/dashboard");
}
