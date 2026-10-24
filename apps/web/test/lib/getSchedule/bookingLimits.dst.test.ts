import { createBookingScenario, TestData } from "@calcom/testing/lib/bookingScenario/bookingScenario";
import dayjs from "@calcom/dayjs";
import { getAvailableSlotsService } from "@calcom/features/di/containers/AvailableSlots";
import type { BookingStatus } from "@calcom/prisma/enums";
import { describe, expect, test, vi } from "vitest";
import { setupAndTeardown } from "./setupAndTeardown";

const HOST_TIME_ZONE = "America/Los_Angeles";

const wallClock = (time: string) => new Date(`1970-01-01T${time}:00.000Z`);

async function getSlotCountsByHostDay(bookingStart: string) {
  await createBookingScenario({
    eventTypes: [
      {
        id: 1,
        length: 30,
        beforeEventBuffer: 0,
        afterEventBuffer: 0,
        bookingLimits: { PER_DAY: 1 },
        users: [{ id: 101 }],
      },
    ],
    users: [
      {
        ...TestData.users.example,
        id: 101,
        defaultScheduleId: 1,
        timeZone: HOST_TIME_ZONE,
        schedules: [
          {
            id: 1,
            name: "Weekday afternoons and evenings",
            timeZone: HOST_TIME_ZONE,
            availability: [
              {
                days: [1, 2, 4],
                startTime: wallClock("14:00"),
                endTime: wallClock("17:30"),
                date: null,
              },
              {
                days: [1, 2, 3, 4],
                startTime: wallClock("20:00"),
                endTime: wallClock("21:30"),
                date: null,
              },
            ],
          },
        ],
      },
    ],
    bookings: [
      {
        userId: 101,
        eventTypeId: 1,
        startTime: bookingStart,
        endTime: dayjs(bookingStart).add(30, "minute").toISOString(),
        status: "ACCEPTED" as BookingStatus,
      },
    ],
  });

  const { slots } = await getAvailableSlotsService().getAvailableSlots({
    input: {
      eventTypeId: 1,
      eventTypeSlug: "",
      startTime: "2026-10-26T07:00:00.000Z",
      endTime: "2026-11-07T07:59:59.999Z",
      timeZone: HOST_TIME_ZONE,
      isTeamEvent: false,
      orgSlug: null,
    },
  });

  const counts: Record<string, number> = {};
  for (const daySlots of Object.values(slots)) {
    for (const slot of daySlots) {
      const hostDay = dayjs(slot.time).tz(HOST_TIME_ZONE).format("YYYY-MM-DD");
      counts[hostDay] = (counts[hostDay] ?? 0) + 1;
    }
  }
  return counts;
}

describe("getSchedule booking limits across daylight saving", () => {
  setupAndTeardown();

  test("closes the host's whole day after the Pacific fallback once the daily limit is reached", async () => {
    vi.setSystemTime("2026-10-24T01:44:16.000Z");

    // 2:00pm Pacific on Monday Nov 2, the day after the Nov 1 fallback
    const counts = await getSlotCountsByHostDay("2026-11-02T22:00:00.000Z");

    expect(counts["2026-11-02"]).toBeUndefined();
    expect(counts["2026-11-03"]).toBe(10);
    expect(counts["2026-10-26"]).toBe(10);
  });

  test("closes the host's whole day when no daylight-saving change is involved", async () => {
    vi.setSystemTime("2026-10-24T01:44:16.000Z");

    // 2:00pm Pacific on Tuesday Oct 27
    const counts = await getSlotCountsByHostDay("2026-10-27T21:00:00.000Z");

    expect(counts["2026-10-27"]).toBeUndefined();
    expect(counts["2026-10-26"]).toBe(10);
    expect(counts["2026-11-02"]).toBe(10);
  });
});
