import { describe, expect, it } from "vitest";

import { getSchedulerTimeZone } from "./getSchedulerTimeZone";

describe("getSchedulerTimeZone", () => {
  it("prefers event schedule timezone", () => {
    expect(
      getSchedulerTimeZone({
        eventScheduleTimeZone: "America/Los_Angeles",
        defaultScheduleTimeZone: "Asia/Taipei",
        eventTimeZone: "UTC",
        userTimeZone: "Europe/London",
      })
    ).toBe("America/Los_Angeles");
  });

  it("falls back to organizer default schedule when event has no schedule", () => {
    expect(
      getSchedulerTimeZone({
        eventScheduleTimeZone: null,
        defaultScheduleTimeZone: "America/Los_Angeles",
        eventTimeZone: null,
        userTimeZone: "Asia/Taipei",
      })
    ).toBe("America/Los_Angeles");
  });

  it("treats empty strings as missing", () => {
    expect(
      getSchedulerTimeZone({
        eventScheduleTimeZone: "",
        defaultScheduleTimeZone: "",
        eventTimeZone: "",
        userTimeZone: "America/Los_Angeles",
      })
    ).toBe("America/Los_Angeles");
  });

  it("returns undefined when nothing is set", () => {
    expect(
      getSchedulerTimeZone({
        eventScheduleTimeZone: null,
        defaultScheduleTimeZone: null,
        eventTimeZone: null,
        userTimeZone: null,
      })
    ).toBeUndefined();
  });
});
