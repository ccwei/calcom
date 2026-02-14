import { Controller, useFormContext } from "react-hook-form";
import type { z } from "zod";

import useLockedFieldsManager from "@calcom/features/ee/managed-event-types/hooks/useLockedFieldsManager";
import { LearnMoreLink } from "@calcom/features/eventtypes/components/LearnMoreLink";
import type {
  FormValues,
  EventTypeSetupProps,
  CheckboxClassNames,
  InputClassNames,
  SettingsToggleClassNames,
} from "@calcom/features/eventtypes/lib/types";
import { MAX_SEATS_PER_TIME_SLOT } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import type { EditableSchema } from "@calcom/prisma/zod-utils";
import classNames from "@calcom/ui/classNames";
import { Alert } from "@calcom/ui/components/alert";
import { SettingsToggle, TextField } from "@calcom/ui/components/form";

export type EventAdvancedTabCustomClassNames = {
  seatsOptions?: SettingsToggleClassNames & {
    children?: string;
    showAttendeesCheckbox?: CheckboxClassNames;
    showAvalableSeatCountCheckbox?: CheckboxClassNames;
    seatsInput: InputClassNames;
  };
};

export type EventAdvancedBaseProps = Pick<EventTypeSetupProps, "eventType"> & {
  customClassNames?: EventAdvancedTabCustomClassNames;
};

export type EventAdvancedTabProps = EventAdvancedBaseProps & {
  calendarsQuery: {
    data?: RouterOutputs["viewer"]["calendars"]["connectedCalendars"];
    isPending: boolean;
    error: unknown;
  };
  showBookerLayoutSelector: boolean;
  localeOptions?: { value: string; label: string }[];
  verifiedEmails?: string[];
};

type CalendarSettingsProps = {
  eventType: EventAdvancedTabProps["eventType"];
  customClassNames?: EventAdvancedTabCustomClassNames;
  calendarsQuery: NonNullable<EventAdvancedTabProps["calendarsQuery"]>;
  eventNameLocked: {
    disabled: boolean;
    LockedIcon: false | JSX.Element;
  };
  eventNamePlaceholder: string;
  setShowEventNameTip: Dispatch<SetStateAction<boolean>>;
  showToast: EventAdvancedTabProps["showToast"];
  verifiedSecondaryEmails: { label: string; value: number }[];
  userEmail: string;
  isTeamEventType: boolean;
  isChildrenManagedEventType: boolean;
};

export const EventAdvancedTab = ({
  eventType,
  customClassNames,
}: EventAdvancedTabProps) => {
  const formMethods = useFormContext<FormValues>();
  const { t } = useLocale();
  const seatsEnabled = formMethods.watch("seatsPerTimeSlotEnabled");
  const multiLocation = (formMethods.getValues("locations") || []).length > 1;
  const noShowFeeEnabled =
    formMethods.getValues("metadata")?.apps?.stripe?.enabled === true &&
    formMethods.getValues("metadata")?.apps?.stripe?.paymentOption === "HOLD";

  const isRecurringEvent = !!formMethods.getValues("recurringEvent");

  const toggleGuests = (enabled: boolean) => {
    const bookingFields = formMethods.getValues("bookingFields");
    formMethods.setValue(
      "bookingFields",
      bookingFields.map((field) => {
        if (field.name === "guests") {
          return {
            ...field,
            hidden: !enabled,
            editable: (!enabled
              ? "system-but-hidden"
              : "system-but-optional") as z.infer<typeof EditableSchema>,
          };
        }
        return field;
      }),
      { shouldDirty: true }
    );
  };

  const { shouldLockDisableProps } = useLockedFieldsManager({
    eventType,
    translate: t,
    formMethods,
  });

  const seatsLocked = shouldLockDisableProps("seatsPerTimeSlotEnabled");

  return (
    <div className="stack-y-4 flex flex-col">
      <Controller
        name="seatsPerTimeSlotEnabled"
        render={({ field: { value, onChange } }) => (
          <>
            <SettingsToggle
              labelClassName={classNames(
                "text-sm",
                customClassNames?.seatsOptions?.label
              )}
              toggleSwitchAtTheEnd={true}
              switchContainerClassName={classNames(
                "border-subtle rounded-lg border py-6 px-4 sm:px-6",
                value && "rounded-b-none",
                customClassNames?.seatsOptions?.container
              )}
              childrenClassName={classNames(
                "lg:ml-0",
                customClassNames?.seatsOptions?.children
              )}
              descriptionClassName={customClassNames?.seatsOptions?.description}
              data-testid="offer-seats-toggle"
              title={t("offer_seats") + " (for Group sessions only)"}
              {...seatsLocked}
              description={
                <LearnMoreLink
                  t={t}
                  i18nKey="offer_seats_description"
                  href="https://cal.com/help/event-types/offer-seats"
                />
              }
              checked={value}
              disabled={
                noShowFeeEnabled ||
                multiLocation ||
                (!seatsEnabled && isRecurringEvent)
              }
              tooltip={
                multiLocation
                  ? t("multilocation_doesnt_support_seats")
                  : noShowFeeEnabled
                  ? t("no_show_fee_doesnt_support_seats")
                  : isRecurringEvent
                  ? t("recurring_event_doesnt_support_seats")
                  : undefined
              }
              onCheckedChange={(e) => {
                // Enabling seats will disable guests and requiring confirmation until fully supported
                if (e) {
                  toggleGuests(false);
                  formMethods.setValue("requiresConfirmation", false, {
                    shouldDirty: true,
                  });
                  formMethods.setValue("metadata.multipleDuration", undefined, {
                    shouldDirty: true,
                  });
                  formMethods.setValue(
                    "seatsPerTimeSlot",
                    eventType.seatsPerTimeSlot ?? 2,
                    {
                      shouldDirty: true,
                    }
                  );
                } else {
                  formMethods.setValue("seatsPerTimeSlot", null);
                  toggleGuests(true);
                }
                onChange(e);
              }}
            >
              <div className="border-subtle rounded-b-lg border border-t-0 p-6">
                <Controller
                  name="seatsPerTimeSlot"
                  render={({ field: { value, onChange } }) => (
                    <div>
                      <TextField
                        required
                        name="seatsPerTimeSlot"
                        labelSrOnly
                        label={t("number_of_seats")}
                        type="number"
                        disabled={seatsLocked.disabled}
                        //For old events if value > MAX_SEATS_PER_TIME_SLOT
                        value={
                          value > MAX_SEATS_PER_TIME_SLOT
                            ? MAX_SEATS_PER_TIME_SLOT
                            : value ?? 1
                        }
                        step={1}
                        placeholder="1"
                        min={1}
                        max={MAX_SEATS_PER_TIME_SLOT}
                        containerClassName={classNames(
                          "max-w-80",
                          customClassNames?.seatsOptions?.seatsInput.container
                        )}
                        addOnClassname={
                          customClassNames?.seatsOptions?.seatsInput.addOn
                        }
                        className={
                          customClassNames?.seatsOptions?.seatsInput?.input
                        }
                        labelClassName={
                          customClassNames?.seatsOptions?.seatsInput?.label
                        }
                        addOnSuffix={t("seats")}
                        onChange={(e) => {
                          const enteredValue = parseInt(e.target.value);
                          onChange(
                            Math.min(enteredValue, MAX_SEATS_PER_TIME_SLOT)
                          );
                        }}
                        data-testid="seats-per-time-slot"
                      />
                    </div>
                  )}
                />
              </div>
            </SettingsToggle>
            {noShowFeeEnabled && (
              <Alert
                severity="warning"
                title={t("seats_and_no_show_fee_error")}
              />
            )}
          </>
        )}
      />
    </div>
  );
};
