-- Replace TWICE_WEEKLY with MULTI_WEEKLY (any number of days, not just 2) and
-- remove TWICE_MONTHLY. No existing rows use these two values.
ALTER TYPE "RecurrenceType" RENAME TO "RecurrenceType_old";

CREATE TYPE "RecurrenceType" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MULTI_WEEKLY', 'MONTHLY');

ALTER TABLE "Deadline" ALTER COLUMN "recurrenceType" TYPE "RecurrenceType" USING ("recurrenceType"::text::"RecurrenceType");

DROP TYPE "RecurrenceType_old";
