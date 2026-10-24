import type { Dayjs } from "@calcom/dayjs";
import dayjs from "@calcom/dayjs";
import { withReporting } from "@calcom/lib/sentryWrapper";
import type { IntervalLimitUnit } from "../intervalLimitSchema";
import { toPeriodLabel } from "./zonedPeriod";

function _getPeriodStartDatesBetween(
  dateFrom: Dayjs,
  dateTo: Dayjs,
  period: IntervalLimitUnit,
  timeZone?: string
): Dayjs[] {
  if (!timeZone) {
    const dates: Dayjs[] = [];
    let startDate = dayjs(dateFrom).startOf(period);
    const endDate = dayjs(dateTo).endOf(period);
    while (startDate.isBefore(endDate)) {
      dates.push(startDate);
      startDate = startDate.add(1, period);
    }
    return dates;
  }

  const dates: Dayjs[] = [];
  let label = toPeriodLabel(dateFrom, period, timeZone);
  const lastLabel = toPeriodLabel(dateTo, period, timeZone);
  while (label <= lastLabel) {
    dates.push(dayjs.tz(label, timeZone));
    label = dayjs.utc(label).add(1, period).format("YYYY-MM-DD");
  }
  return dates;
}

export const getPeriodStartDatesBetween = withReporting(
  _getPeriodStartDatesBetween,
  "getPeriodStartDatesBetween"
);
