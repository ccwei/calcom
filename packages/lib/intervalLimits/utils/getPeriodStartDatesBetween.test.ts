import dayjs from "@calcom/dayjs";
import { describe, expect, it } from "vitest";
import { getPeriodStartDatesBetween } from "./getPeriodStartDatesBetween";

describe("getPeriodStartDatesBetween", () => {
  it("starts each Pacific day at local midnight across the November fallback", () => {
    const starts = getPeriodStartDatesBetween(
      dayjs("2026-10-31T12:00:00.000Z"),
      dayjs("2026-11-03T12:00:00.000Z"),
      "day",
      "America/Los_Angeles"
    );

    expect(starts.map((start) => start.toISOString())).toEqual([
      "2026-10-31T07:00:00.000Z",
      "2026-11-01T07:00:00.000Z",
      "2026-11-02T08:00:00.000Z",
      "2026-11-03T08:00:00.000Z",
    ]);
  });

  it("starts each Pacific day at local midnight across the March spring-forward", () => {
    const starts = getPeriodStartDatesBetween(
      dayjs("2026-03-07T12:00:00.000Z"),
      dayjs("2026-03-10T12:00:00.000Z"),
      "day",
      "America/Los_Angeles"
    );

    expect(starts.map((start) => start.toISOString())).toEqual([
      "2026-03-07T08:00:00.000Z",
      "2026-03-08T08:00:00.000Z",
      "2026-03-09T07:00:00.000Z",
      "2026-03-10T07:00:00.000Z",
    ]);
  });

  it("keeps weekly boundaries on the host calendar across the fallback", () => {
    const starts = getPeriodStartDatesBetween(
      dayjs("2026-10-26T01:44:16.000Z"),
      dayjs("2026-11-10T12:00:00.000Z"),
      "week",
      "America/Los_Angeles"
    );

    expect(starts.map((start) => start.format("YYYY-MM-DD"))).toEqual([
      "2026-10-25",
      "2026-11-01",
      "2026-11-08",
    ]);
    expect(starts[1]?.toISOString()).toBe("2026-11-01T07:00:00.000Z");
    expect(starts[2]?.toISOString()).toBe("2026-11-08T08:00:00.000Z");
  });

  it("starts each Sydney day at local midnight across the October daylight-saving change", () => {
    const starts = getPeriodStartDatesBetween(
      dayjs("2026-10-03T00:00:00.000Z"),
      dayjs("2026-10-06T00:00:00.000Z"),
      "day",
      "Australia/Sydney"
    );

    expect(starts.map((start) => start.toISOString())).toEqual([
      "2026-10-02T14:00:00.000Z",
      "2026-10-03T14:00:00.000Z",
      "2026-10-04T13:00:00.000Z",
      "2026-10-05T13:00:00.000Z",
    ]);
  });

  it("starts Sydney weeks at local midnight when the week begins on the October changeover", () => {
    const starts = getPeriodStartDatesBetween(
      dayjs("2026-09-28T00:00:00.000Z"),
      dayjs("2026-10-12T00:00:00.000Z"),
      "week",
      "Australia/Sydney"
    );

    expect(starts.map((start) => start.format("YYYY-MM-DD"))).toEqual([
      "2026-09-27",
      "2026-10-04",
      "2026-10-11",
    ]);
    expect(starts[1]?.toISOString()).toBe("2026-10-03T14:00:00.000Z");
    expect(starts[2]?.toISOString()).toBe("2026-10-10T13:00:00.000Z");
  });

  it("includes the Sydney fallback day when the window ends on that day", () => {
    const starts = getPeriodStartDatesBetween(
      dayjs("2026-04-04T02:00:00.000Z"),
      dayjs("2026-04-04T13:00:00.000Z"),
      "day",
      "Australia/Sydney"
    );

    expect(starts.map((start) => start.format("YYYY-MM-DD"))).toEqual(["2026-04-04", "2026-04-05"]);
    expect(starts[1]?.toISOString()).toBe("2026-04-04T13:00:00.000Z");
  });

  it("uses local midnight in a timezone without daylight saving", () => {
    const starts = getPeriodStartDatesBetween(
      dayjs("2026-11-01T16:00:00.000Z"),
      dayjs("2026-11-02T16:00:00.000Z"),
      "day",
      "Asia/Taipei"
    );

    expect(starts.map((start) => start.toISOString())).toEqual([
      "2026-11-01T16:00:00.000Z",
      "2026-11-02T16:00:00.000Z",
    ]);
  });
});
