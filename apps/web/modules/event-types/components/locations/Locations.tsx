import type { EventLocationType } from "@calcom/app-store/locations";
import { isAllowedOnlineConferencingLocation, MeetLocationType } from "@calcom/app-store/locations";
import { useIsPlatform } from "@calcom/atoms/hooks/useIsPlatform";
import type { LocationCustomClassNames } from "@calcom/features/eventtypes/components/locations/types";
import type { EventTypeSetupProps, LocationFormValues } from "@calcom/features/eventtypes/lib/types";
import type { SingleValueLocationOption } from "@calcom/features/form/components/LocationSelect";
import LocationSelect from "@calcom/features/form/components/LocationSelect";
import ServerTrans from "@calcom/lib/components/ServerTrans";
import { WEBAPP_URL } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import classNames from "@calcom/ui/classNames";
import { CheckIcon } from "@coss/ui/icons";
import Link from "next/link";
import { useEffect } from "react";
import type { Control, FormState, UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { useWatch } from "react-hook-form";
import ConnectGoogleMeetPrompt from "./ConnectGoogleMeetPrompt";

export type TEventTypeLocation = Pick<EventTypeSetupProps["eventType"], "locations" | "calVideoSettings">;
export type TLocationOptions = Pick<EventTypeSetupProps, "locationOptions">["locationOptions"];
export type TDestinationCalendar = { integration: string } | null;
export type TPrefillLocation = { credentialId?: number; type: string };

type LocationsProps = {
  team: { id: number } | null;
  destinationCalendar: TDestinationCalendar;
  showAppStoreLink: boolean;
  isChildrenManagedEventType?: boolean;
  isManagedEventType?: boolean;
  disableLocationProp?: boolean;
  getValues: UseFormGetValues<LocationFormValues>;
  setValue: UseFormSetValue<LocationFormValues>;
  control: Control<LocationFormValues>;
  formState: FormState<LocationFormValues>;
  eventType: TEventTypeLocation;
  locationOptions: TLocationOptions;
  prefillLocation?: SingleValueLocationOption;
  customClassNames?: LocationCustomClassNames;
};

const getLocationFromType = (type: EventLocationType["type"], locationOptions: TLocationOptions) => {
  for (const locationOption of locationOptions) {
    const option = locationOption.options.find((option) => option.value === type);
    if (option) {
      return option;
    }
  }
};

const getLocationInfo = ({
  eventType,
  locationOptions,
}: {
  eventType: TEventTypeLocation;
  locationOptions: TLocationOptions;
}) => {
  const locationAvailable =
    eventType.locations &&
    eventType.locations.length > 0 &&
    locationOptions.some((op) => op.options.find((opt) => opt.value === eventType.locations[0].type));
  const locationDetails = eventType.locations &&
    eventType.locations.length > 0 &&
    !locationAvailable && {
      slug: eventType.locations[0].type.replace("integrations:", "").replace(":", "-").replace("_video", ""),
      name: eventType.locations[0].type
        .replace("integrations:", "")
        .replace(":", " ")
        .replace("_video", "")
        .split(" ")
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(" "),
    };
  return { locationAvailable, locationDetails };
};

const Locations: React.FC<LocationsProps> = ({
  isChildrenManagedEventType,
  disableLocationProp,
  isManagedEventType,
  getValues,
  setValue,
  control,
  eventType,
  prefillLocation,
  customClassNames,
  ...props
}) => {
  const { t } = useLocale();
  const isPlatform = useIsPlatform();

  const locationOptions = props.locationOptions
    .map((locationOption) => {
      const options = locationOption.options.filter((option) => {
        if (isManagedEventType && option.value === "") {
          return true;
        }
        return isAllowedOnlineConferencingLocation(option.value);
      });

      return {
        ...locationOption,
        options,
      };
    })
    .filter((locationOption) => locationOption.options.length > 0);

  const hasConferencingOptions = locationOptions.some((group) => group.options.length > 0);
  const locations = useWatch({ control, name: "locations" }) ?? getValues("locations");
  const currentLocation = locations?.[0];
  const hasValidLocation =
    (isManagedEventType && currentLocation?.type === "") ||
    isAllowedOnlineConferencingLocation(currentLocation?.type);
  const selectedFromCurrent = currentLocation
    ? getLocationFromType(currentLocation.type, locationOptions)
    : undefined;
  const selectedOption =
    selectedFromCurrent ??
    (isManagedEventType ? locationOptions.find((op) => op.label === t("default"))?.options[0] : null);

  const { locationDetails, locationAvailable } = getLocationInfo({
    eventType,
    locationOptions: props.locationOptions,
  });

  useEffect(() => {
    if (!prefillLocation || hasValidLocation) {
      return;
    }

    setValue(
      "locations",
      [
        {
          type: prefillLocation.value,
          credentialId: prefillLocation.credentialId,
        },
      ],
      { shouldDirty: true }
    );
  }, [prefillLocation, hasValidLocation, setValue]);

  return (
    <div className={classNames("w-full", customClassNames?.container)}>
      <div className="stack-y-2">
        {hasConferencingOptions ? (
          <LocationSelect
            name="locations.0.type"
            placeholder={t("select")}
            options={locationOptions}
            value={selectedOption ?? null}
            isDisabled={disableLocationProp}
            isClearable={false}
            isSearchable={false}
            className={classNames(
              "block w-full min-w-0 flex-1 rounded-sm text-sm",
              customClassNames?.locationSelect?.selectWrapper
            )}
            customClassNames={customClassNames?.locationSelect}
            menuPlacement="auto"
            onChange={(option: SingleValueLocationOption) => {
              if (!option?.value) {
                return;
              }
              setValue(
                "locations",
                [
                  {
                    type: option.value,
                    ...(option.credentialId && {
                      credentialId: option.credentialId,
                      teamName: option.teamName ?? undefined,
                    }),
                  },
                ],
                { shouldDirty: true }
              );
            }}
          />
        ) : null}
        {hasValidLocation &&
          currentLocation?.type === MeetLocationType &&
          props.destinationCalendar?.integration !== "google_calendar" && (
            <div className="text-default flex items-center text-sm">
              <div className="mr-1.5 h-3 w-3">
                <CheckIcon className="h-3 w-3" />
              </div>
              <p className="text-default text-sm">
                <ServerTrans
                  t={t}
                  i18nKey="event_type_requires_google_calendar"
                  components={[
                    <Link
                      key="event_type_requires_google_calendar"
                      className="cursor-pointer text-blue-500 underline"
                      href="/apps/google-calendar">
                      here
                    </Link>,
                  ]}
                />
              </p>
            </div>
          )}
        {isChildrenManagedEventType && !locationAvailable && locationDetails && (
          <p className="pl-1 text-sm leading-none text-red-600">
            {t("app_not_connected", { appName: locationDetails.name })}{" "}
            <a className="underline" href={`${WEBAPP_URL}/apps/${locationDetails.slug}`}>
              {t("connect_now")}
            </a>
          </p>
        )}
      </div>
      {!isPlatform && (!hasConferencingOptions || !hasValidLocation) && (
        <ConnectGoogleMeetPrompt className="mt-2" />
      )}
    </div>
  );
};

export default Locations;
