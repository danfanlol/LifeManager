-- AlterTable
ALTER TABLE "Deadline" ADD COLUMN     "lastMissedAt" TIMESTAMP(3),
ADD COLUMN     "lastMissedPeriodKey" TEXT;

-- CreateTable
CREATE TABLE "MissedDeadline" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deadlineId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "missedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissedDeadline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MissedDeadline_userId_idx" ON "MissedDeadline"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MissedDeadline_deadlineId_periodKey_key" ON "MissedDeadline"("deadlineId", "periodKey");

-- AddForeignKey
ALTER TABLE "MissedDeadline" ADD CONSTRAINT "MissedDeadline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissedDeadline" ADD CONSTRAINT "MissedDeadline_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "Deadline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
