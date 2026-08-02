"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { calendarDateToUtcMidnight } from "@/lib/calendar";

export async function saveHourNote(
  dateParam: string,
  hour: number,
  formData: FormData,
) {
  const session = await requireSession();
  const note = String(formData.get("note") ?? "").trim();
  const date = calendarDateToUtcMidnight(dateParam);

  if (!note) {
    await prisma.hourLog.deleteMany({
      where: { userId: session.user.id, date, hour },
    });
  } else {
    await prisma.hourLog.upsert({
      where: { userId_date_hour: { userId: session.user.id, date, hour } },
      create: { userId: session.user.id, date, hour, note },
      update: { note },
    });
  }

  revalidatePath(`/calendar/${dateParam}`);
  revalidatePath("/calendar");
}
