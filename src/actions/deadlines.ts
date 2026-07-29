"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { deadlineSchema } from "@/lib/validation";
import { periodKeyFor, getEffectiveAnchorDate } from "@/lib/recurrence";

function readDeadlineForm(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    recurrenceType: formData.get("recurrenceType"),
    dueDate: formData.get("dueDate") || undefined,
    daysOfWeek: formData.getAll("daysOfWeek").map(Number),
    daysOfMonth: formData.getAll("daysOfMonth").map(Number),
    planId: formData.get("planId") || undefined,
  };
}

function toDueDateInput(dueDate: string | undefined) {
  if (!dueDate) return undefined;
  // Store as UTC midnight of the chosen calendar date (a date, not an instant).
  return DateTime.fromISO(dueDate, { zone: "utc" }).startOf("day").toJSDate();
}

export async function createDeadline(_prevState: unknown, formData: FormData) {
  const session = await requireSession();
  const parsed = deadlineSchema.safeParse(readDeadlineForm(formData));

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { data } = parsed;
  const planId = data.planId || null;

  if (planId) {
    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId: session.user.id },
      select: { id: true },
    });
    if (!plan) {
      return { errors: { planId: ["Plan not found."] } };
    }
  }

  await prisma.deadline.create({
    data: {
      title: data.title,
      description: data.description || null,
      recurrenceType: data.recurrenceType,
      dueDate: data.recurrenceType === "NONE" ? toDueDateInput(data.dueDate) : null,
      daysOfWeek: data.recurrenceType === "WEEKLY" || data.recurrenceType === "MULTI_WEEKLY"
        ? data.daysOfWeek
        : [],
      daysOfMonth: data.recurrenceType === "MONTHLY" ? data.daysOfMonth : [],
      planId,
      userId: session.user.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/plans");
  if (planId) revalidatePath(`/plans/${planId}`);
  redirect(planId ? `/plans/${planId}` : "/dashboard");
}

export async function updateDeadline(
  deadlineId: string,
  _prevState: unknown,
  formData: FormData,
) {
  const session = await requireSession();
  const parsed = deadlineSchema.safeParse(readDeadlineForm(formData));

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.deadline.findFirst({
    where: { id: deadlineId, userId: session.user.id },
  });
  if (!existing) {
    redirect("/dashboard");
  }

  const { data } = parsed;
  const planId = data.planId || null;

  if (planId) {
    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId: session.user.id },
      select: { id: true },
    });
    if (!plan) {
      return { errors: { planId: ["Plan not found."] } };
    }
  }

  await prisma.deadline.update({
    where: { id: deadlineId },
    data: {
      title: data.title,
      description: data.description || null,
      recurrenceType: data.recurrenceType,
      dueDate: data.recurrenceType === "NONE" ? toDueDateInput(data.dueDate) : null,
      daysOfWeek: data.recurrenceType === "WEEKLY" || data.recurrenceType === "MULTI_WEEKLY"
        ? data.daysOfWeek
        : [],
      daysOfMonth: data.recurrenceType === "MONTHLY" ? data.daysOfMonth : [],
      planId,
      // Recurrence anchors may have changed, so any previous "done"/"notified"
      // markers no longer refer to a meaningful period.
      lastCompletedPeriodKey: null,
      lastCompletedAt: null,
      lastNotifiedPeriodKey: null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/plans");
  if (existing.planId) revalidatePath(`/plans/${existing.planId}`);
  if (planId) revalidatePath(`/plans/${planId}`);
  redirect(planId ? `/plans/${planId}` : "/dashboard");
}

export async function deleteDeadline(deadlineId: string) {
  const session = await requireSession();

  const existing = await prisma.deadline.findFirst({
    where: { id: deadlineId, userId: session.user.id },
  });

  await prisma.deadline.deleteMany({
    where: { id: deadlineId, userId: session.user.id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/plans");
  if (existing?.planId) revalidatePath(`/plans/${existing.planId}`);
  redirect(existing?.planId ? `/plans/${existing.planId}` : "/dashboard");
}

export async function toggleComplete(deadlineId: string) {
  const session = await requireSession();

  const deadline = await prisma.deadline.findFirst({
    where: { id: deadlineId, userId: session.user.id },
  });
  if (!deadline) return;

  const timezone = (session.user as { timezone?: string }).timezone || "UTC";
  const now = DateTime.now().setZone(timezone);

  const anchor = getEffectiveAnchorDate(deadline, now);
  if (!anchor) return;
  const periodKey = periodKeyFor(anchor);

  const isCurrentlyDone = deadline.lastCompletedPeriodKey === periodKey;

  await prisma.deadline.update({
    where: { id: deadlineId },
    data: isCurrentlyDone
      ? { lastCompletedPeriodKey: null, lastCompletedAt: null }
      : { lastCompletedPeriodKey: periodKey, lastCompletedAt: new Date() },
  });

  revalidatePath("/dashboard");
  if (deadline.planId) revalidatePath(`/plans/${deadline.planId}`);
}
