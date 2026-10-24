import dayjs from "@calcom/dayjs";
import { describe, expect, it } from "vitest";
import { zonedPeriodEnd, zonedPeriodStart } from "./zonedPeriod";

describe("zonedPeriodStart / zonedPeriodEnd", () => {
  it("brackets the 25-hour Pacific fallback day", () => {
    const instant = dayjs("2026-11-01T20:00:00.000Z");
    expect(zonedPeriodStart(instant, "day", "America/Los_Angeles").toISOString()).toBe(
      "2026-11-01T07:00:00.000Z"
    );
    expect(zonedPeriodEnd(instant, "day", "America/Los_Angeles").toISOString()).toBe(
      "2026-11-02T07:59:59.999Z"
    );
  });

  it("falls back to dayjs startOf/endOf without a timezone", () => {
    const instant = dayjs.utc("2026-11-02T22:00:00.000Z");
    expect(zonedPeriodStart(instant, "day").toISOString()).toBe("2026-11-02T00:00:00.000Z");
    expect(zonedPeriodEnd(instant, "day").toISOString()).toBe("2026-11-02T23:59:59.999Z");
  });
});
