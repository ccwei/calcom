process.env.TZ = "America/Chicago";

import { describe, expect, it } from "vitest";

import { localCalendarDateToUtcDateOnly, utcDateOnlyToLocalCalendarDate } from "./periodDateRange";

describe("periodDateRange", () => {
  describe("localCalendarDateToUtcDateOnly", () => {
    it("stores the clicked local calendar day as UTC midnight", () => {
      // User in Chicago clicks Aug 9 on the calendar (local midnight Aug 9)
      const clicked = new Date(2026, 7, 9);
      const stored = localCalendarDateToUtcDateOnly(clicked);

      expect(stored.toISOString()).toBe("2026-08-09T00:00:00.000Z");
    });
  });

  describe("utcDateOnlyToLocalCalendarDate", () => {
    it("round-trips so west-of-UTC browsers show the stored calendar day", () => {
      const stored = new Date("2026-08-09T00:00:00.000Z");
      const forPicker = utcDateOnlyToLocalCalendarDate(stored);

      // Without conversion, format() in Chicago would show Aug 8
      expect(stored.getMonth()).toBe(7);
      expect(stored.getDate()).toBe(8);

      expect(forPicker.getFullYear()).toBe(2026);
      expect(forPicker.getMonth()).toBe(7);
      expect(forPicker.getDate()).toBe(9);
      expect(forPicker.getHours()).toBe(0);
    });

    it("round-trips through localCalendarDateToUtcDateOnly", () => {
      const clicked = new Date(2026, 7, 14);
      const stored = localCalendarDateToUtcDateOnly(clicked);
      const displayed = utcDateOnlyToLocalCalendarDate(stored);

      expect(stored.toISOString()).toBe("2026-08-14T00:00:00.000Z");
      expect(displayed.getFullYear()).toBe(2026);
      expect(displayed.getMonth()).toBe(7);
      expect(displayed.getDate()).toBe(14);
    });

    it("keeps legacy non-UTC-midnight values on the local calendar day", () => {
      // Old format: midnight Aug 9 Chicago stored as 05:00 UTC
      const legacy = new Date("2026-08-09T05:00:00.000Z");
      const forPicker = utcDateOnlyToLocalCalendarDate(legacy);

      expect(forPicker.getFullYear()).toBe(2026);
      expect(forPicker.getMonth()).toBe(7);
      expect(forPicker.getDate()).toBe(9);
    });
  });
});
