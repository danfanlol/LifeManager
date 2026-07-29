import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { getDeadlineStatus } from "@/lib/recurrence";
import { sendPushToUser } from "@/lib/push";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deadlines = await prisma.deadline.findMany({
    where: { isActive: true },
    include: { user: { select: { id: true, timezone: true } } },
  });

  let checked = 0;
  let notified = 0;

  for (const deadline of deadlines) {
    checked += 1;
    const now = DateTime.now().setZone(deadline.user.timezone);
    const status = getDeadlineStatus(deadline, now);
    if (!status) continue;

    const isActionable = status.status === "dueToday" || status.status === "overdue";
    const alreadyNotifiedThisPeriod = deadline.lastNotifiedPeriodKey === status.periodKey;
    if (!isActionable || alreadyNotifiedThisPeriod) continue;

    await sendPushToUser(deadline.user.id, {
      title: status.status === "overdue" ? "Overdue" : "Due today",
      body: deadline.title,
      url: "/dashboard",
    });

    await prisma.deadline.update({
      where: { id: deadline.id },
      data: { lastNotifiedPeriodKey: status.periodKey },
    });
    notified += 1;
  }

  return NextResponse.json({ checked, notified });
}
