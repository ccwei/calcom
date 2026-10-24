import type { Dayjs } from "@calcom/dayjs";
import dayjs from "@calcom/dayjs";
import type { IntervalLimitUnit } from "../intervalLimitSchema";

const DATE = "YYYY-MM-DD";

// Calendar arithmetic happens on UTC date labels (no DST there); the only zoned
// operation is resolving a label to local midnight.
export function toPeriodLabel(date: Dayjs, period: IntervalLimitUnit, timeZone: string): string {
  return dayjs.utc(date.tz(timeZone).format(DATE)).startOf(period).format(DATE);
}

export function zonedPeriodStart(date: Dayjs, period: IntervalLimitUnit, timeZone?: string): Dayjs {
  if (!timeZone) return date.startOf(period);
  return dayjs.tz(toPeriodLabel(date, period, timeZone), timeZone);
}

// dayjs `endOf` can apply the next day's offset when the period ends right before a DST
// change (e.g. Australia/Sydney on Apr 4), so derive the end from the next period's start.
export function zonedPeriodEnd(date: Dayjs, period: IntervalLimitUnit, timeZone?: string): Dayjs {
  if (!timeZone) return date.endOf(period);
  const nextLabel = dayjs
    .utc(toPeriodLabel(date, period, timeZone))
    .add(1, period)
    .format(DATE);
  return dayjs.tz(nextLabel, timeZone).subtract(1, "millisecond");
}
