-- CreateTable
CREATE TABLE "HourLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hour" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HourLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HourLog_userId_date_idx" ON "HourLog"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "HourLog_userId_date_hour_key" ON "HourLog"("userId", "date", "hour");

-- AddForeignKey
ALTER TABLE "HourLog" ADD CONSTRAINT "HourLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
