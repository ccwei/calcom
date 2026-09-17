/**
 * Timezone for booking/duration limit period boundaries (day/week/month/year).
 *
 * Matches availability inheritance when EventType.scheduleId is null:
 * event schedule → organizer default schedule → event timezone → user timezone.
 */
export function getSchedulerTimeZone({
  eventScheduleTimeZone,
  defaultScheduleTimeZone,
  eventTimeZone,
  userTimeZone,
}: {
  eventScheduleTimeZone?: string | null;
  defaultScheduleTimeZone?: string | null;
  eventTimeZone?: string | null;
  userTimeZone?: string | null;
}): string | undefined {
  return eventScheduleTimeZone || defaultScheduleTimeZone || eventTimeZone || userTimeZone || undefined;
}
