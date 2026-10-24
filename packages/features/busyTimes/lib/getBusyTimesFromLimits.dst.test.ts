import { prisma } from "@calcom/prisma/__mocks__/prisma";
import dayjs from "@calcom/dayjs";
import LimitManager from "@calcom/lib/intervalLimits/limitManager";
import { describe, expect, it, vi } from "vitest";
import { getBusyTimesFromBookingLimits } from "./getBusyTimesFromLimits";

vi.mock("@calcom/prisma", () => ({
  default: prisma,
  prisma,
}));

describe("getBusyTimesFromBookingLimits daylight saving", () => {
  it("blocks the host calendar day of a booking after the Pacific fallback", async () => {
    const limitManager = new LimitManager();

    await getBusyTimesFromBookingLimits({
      bookings: [
        {
          start: "2026-11-02T22:00:00.000Z",
          end: "2026-11-02T22:30:00.000Z",
          source: "eventType-614-booking-1",
        },
      ],
      bookingLimits: { PER_DAY: 1 },
      dateFrom: dayjs("2026-10-26T01:44:16.000Z"),
      dateTo: dayjs("2026-11-30T15:59:59.000Z"),
      limitManager,
      timeZone: "America/Los_Angeles",
    });

    expect(limitManager.getBusyTimes()).toEqual([
      expect.objectContaining({
        start: "2026-11-02T08:00:00.000Z",
        end: "2026-11-03T07:59:59.999Z",
      }),
    ]);
  });

  it("blocks the Sydney calendar day when daylight saving starts that morning", async () => {
    const limitManager = new LimitManager();

    await getBusyTimesFromBookingLimits({
      bookings: [
        {
          start: "2026-10-04T04:00:00.000Z",
          end: "2026-10-04T04:30:00.000Z",
          source: "eventType-614-booking-2",
        },
      ],
      bookingLimits: { PER_DAY: 1 },
      dateFrom: dayjs("2026-10-01T00:00:00.000Z"),
      dateTo: dayjs("2026-10-08T00:00:00.000Z"),
      limitManager,
      timeZone: "Australia/Sydney",
    });

    expect(limitManager.getBusyTimes()).toEqual([
      expect.objectContaining({
        start: "2026-10-03T14:00:00.000Z",
        end: "2026-10-04T12:59:59.999Z",
      }),
    ]);
  });
});
