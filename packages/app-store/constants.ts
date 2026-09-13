export const MeetLocationType = "integrations:google:meet";

export const ZoomLocationType = "integrations:zoom";

export const MSTeamsLocationType = "integrations:office365_video";

export const DailyLocationType = "integrations:daily";

export const ALLOWED_ONLINE_CONFERENCING_LOCATION_TYPES = [MeetLocationType, ZoomLocationType] as const;

export const ALLOWED_ONLINE_CONFERENCING_APP_SLUGS = ["google-meet", "zoom"] as const;

export type AllowedOnlineConferencingLocationType =
  (typeof ALLOWED_ONLINE_CONFERENCING_LOCATION_TYPES)[number];

export type AllowedOnlineConferencingAppSlug = (typeof ALLOWED_ONLINE_CONFERENCING_APP_SLUGS)[number];

export function isAllowedOnlineConferencingLocation(
  type: string | undefined | null
): type is AllowedOnlineConferencingLocationType {
  return type === MeetLocationType || type === ZoomLocationType;
}

export function isAllowedOnlineConferencingAppSlug(
  slug: string | undefined | null
): slug is AllowedOnlineConferencingAppSlug {
  return slug === "google-meet" || slug === "zoom";
}

export function hasAllowedOnlineConferencingLocation(
  locations: { type: string }[] | null | undefined
): boolean {
  return !!locations?.some((location) => isAllowedOnlineConferencingLocation(location.type));
}

export function getInstalledOnlineConferencingLocationTypes(
  locationOptions: { options: { value: string }[] }[] | null | undefined
): Set<string> {
  const availableTypes = new Set<string>();
  locationOptions?.forEach((group) => {
    group.options.forEach((option) => {
      if (isAllowedOnlineConferencingLocation(option.value)) {
        availableTypes.add(option.value);
      }
    });
  });
  return availableTypes;
}

export function hasInstalledOnlineConferencingLocation(
  locations: { type: string }[] | null | undefined,
  availableLocationTypes: ReadonlySet<string>
): boolean {
  return !!locations?.some(
    (location) =>
      isAllowedOnlineConferencingLocation(location.type) && availableLocationTypes.has(location.type)
  );
}

export function eventHasInstalledOnlineConferencingLocation({
  locations,
  locationOptions,
  schedulingType,
}: {
  locations: { type: string }[] | null | undefined;
  locationOptions: { options: { value: string }[] }[] | null | undefined;
  schedulingType?: string | null;
}): boolean {
  if (schedulingType === "MANAGED" && locations?.some((location) => location.type === "")) {
    return true;
  }
  return hasInstalledOnlineConferencingLocation(
    locations,
    getInstalledOnlineConferencingLocationTypes(locationOptions)
  );
}
