-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "allowDynamicBooking" SET DEFAULT false,
ALTER COLUMN "allowSEOIndexing" SET DEFAULT false,
ALTER COLUMN "receiveMonthlyDigestEmail" SET DEFAULT false;
