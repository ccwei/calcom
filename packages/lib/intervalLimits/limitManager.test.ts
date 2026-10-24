import dayjs from "@calcom/dayjs";
import { describe, expect, it } from "vitest";
import LimitManager from "./limitManager";

function busyTimeFor(start: string, unit: "day" | "week" | "month" | "year", timeZone?: string) {
  const limitManager = new LimitManager();
  limitManager.addBusyTime({ start: dayjs(start), unit, timeZone, title: "title", source: "source" });
  return limitManager.getBusyTimes()[0];
}

describe("LimitManager.addBusyTime", () => {
  it("ends the Sydney day before the April daylight-saving change at local midnight", () => {
    expect(busyTimeFor("2026-04-04T02:00:00.000Z", "day", "Australia/Sydney")).toMatchObject({
      start: "2026-04-03T13:00:00.000Z",
      end: "2026-04-04T12:59:59.999Z",
    });
  });

  it("ends the Sydney day before the October daylight-saving change at local midnight", () => {
    expect(busyTimeFor("2026-10-03T02:00:00.000Z", "day", "Australia/Sydney")).toMatchObject({
      start: "2026-10-02T14:00:00.000Z",
      end: "2026-10-03T13:59:59.999Z",
    });
  });

  it("ends a Sydney week that finishes on the April daylight-saving eve at local midnight", () => {
    expect(busyTimeFor("2026-04-01T02:00:00.000Z", "week", "Australia/Sydney")).toMatchObject({
      start: "2026-03-28T13:00:00.000Z",
      end: "2026-04-04T12:59:59.999Z",
    });
  });

  it("ends the Santiago day before the April change at local midnight", () => {
    expect(busyTimeFor("2026-04-04T15:00:00.000Z", "day", "America/Santiago")).toMatchObject({
      start: "2026-04-04T03:00:00.000Z",
      end: "2026-04-05T03:59:59.999Z",
    });
  });

  it("covers the full 25-hour Pacific fallback day", () => {
    expect(busyTimeFor("2026-11-01T20:00:00.000Z", "day", "America/Los_Angeles")).toMatchObject({
      start: "2026-11-01T07:00:00.000Z",
      end: "2026-11-02T07:59:59.999Z",
    });
  });

  it("covers a Pacific month that spans the fallback", () => {
    expect(busyTimeFor("2026-11-15T20:00:00.000Z", "month", "America/Los_Angeles")).toMatchObject({
      start: "2026-11-01T07:00:00.000Z",
      end: "2026-12-01T07:59:59.999Z",
    });
  });

  it("uses the server calendar when no timezone is given", () => {
    expect(busyTimeFor("2026-04-04T02:00:00.000Z", "day")).toMatchObject({
      start: "2026-04-04T00:00:00.000Z",
      end: "2026-04-04T23:59:59.999Z",
    });
  });
});
