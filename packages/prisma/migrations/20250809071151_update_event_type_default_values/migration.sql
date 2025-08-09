-- AlterTable
ALTER TABLE "EventType" ALTER COLUMN "periodCountCalendarDays" SET DEFAULT true,
ALTER COLUMN "periodDays" SET DEFAULT 7,
ALTER COLUMN "minimumBookingNotice" SET DEFAULT 2880,
ALTER COLUMN "periodType" SET DEFAULT 'rolling',
ALTER COLUMN "bookingLimits" SET DEFAULT '{"PER_WEEK": 4}';
