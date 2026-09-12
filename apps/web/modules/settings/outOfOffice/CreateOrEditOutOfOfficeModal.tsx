import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import dayjs from "@calcom/dayjs";
import { Dialog } from "@calcom/features/components/controlled-dialog";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Alert } from "@calcom/ui/components/alert";
import { Button } from "@calcom/ui/components/button";
import { DialogContent, DialogFooter, DialogHeader } from "@calcom/ui/components/dialog";
import { DateRangePicker } from "@calcom/ui/components/form";
import { Select } from "@calcom/ui/components/form";
import { showToast } from "@calcom/ui/components/toast";

export type { BookingRedirectForm } from "~/settings/outOfOffice/types";
import type { BookingRedirectForm } from "~/settings/outOfOffice/types";

type Option = { value: number; label: string };

export const CreateOrEditOutOfOfficeEntryModal = ({
  openModal,
  closeModal,
  currentlyEditingOutOfOfficeEntry,
}: {
  openModal: boolean;
  closeModal: () => void;
  currentlyEditingOutOfOfficeEntry: BookingRedirectForm | null;
}) => {
  const { t } = useLocale();
  const utils = trpc.useUtils();

  const { data: outOfOfficeReasonList, isPending: isReasonListPending } =
    trpc.viewer.ooo.outOfOfficeReasonList.useQuery();
  const reasonList = (outOfOfficeReasonList || []).map((reason) => ({
    label: `${reason.emoji} ${reason.userId === null ? t(reason.reason) : reason.reason}`,
    value: reason.id,
  }));

  const {
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
  } = useForm<BookingRedirectForm>({
    defaultValues: currentlyEditingOutOfOfficeEntry
      ? currentlyEditingOutOfOfficeEntry
      : {
          dateRange: {
            startDate: dayjs().startOf("d").toDate(),
            endDate: dayjs().startOf("d").add(2, "d").toDate(),
          },
          startDateOffset: dayjs().utcOffset(),
          endDateOffset: dayjs().utcOffset(),
          toTeamUserId: null,
          reasonId: 1,
          forUserId: null,
          notes: undefined,
          showNotePublicly: false,
        },
  });

  const watchedDateRange = watch("dateRange");

  // Fetch user's holiday settings to show warning if OOO dates overlap with holidays
  const { data: holidaySettings } = trpc.viewer.holidays.getUserSettings.useQuery({});

  // Check if selected dates overlap with any enabled holidays
  const overlappingHolidays = useMemo(() => {
    if (!holidaySettings?.countryCode || !watchedDateRange?.startDate || !watchedDateRange?.endDate) {
      return [];
    }

    // Filter holidays that are enabled and fall within the date range
    const startStr = dayjs(watchedDateRange.startDate).format("YYYY-MM-DD");
    const endStr = dayjs(watchedDateRange.endDate).format("YYYY-MM-DD");

    return (holidaySettings.holidays || [])
      .filter((h) => h.enabled && h.date >= startStr && h.date <= endStr)
      .map((h) => ({ date: h.date, holiday: { id: h.id, name: h.name } }));
  }, [holidaySettings, watchedDateRange]);

  const createOrEditOutOfOfficeEntry = trpc.viewer.ooo.outOfOfficeCreateOrUpdate.useMutation({
    onSuccess: () => {
      showToast(
        currentlyEditingOutOfOfficeEntry
          ? t("success_edited_entry_out_of_office")
          : t("success_entry_created"),
        "success"
      );
      utils.viewer.ooo.outOfOfficeEntriesList.invalidate();
      closeModal();
    },
    onError: (error) => {
      showToast(t(error.message), "error");
    },
  });

  return (
    <Dialog
      open={openModal}
      onOpenChange={(open) => {
        if (!open) {
          closeModal();
        }
      }}>
      <DialogContent
        enableOverflow
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}>
        <form
          id="create-or-edit-ooo-form"
          onSubmit={handleSubmit((data) => {
            if (!data.dateRange.endDate) {
              showToast(t("end_date_not_selected"), "error");
            } else {
              createOrEditOutOfOfficeEntry.mutate({
                ...data,
                toTeamUserId: null,
                forUserId: null,
                notes: undefined,
                showNotePublicly: false,
                startDateOffset: -1 * data.dateRange.startDate.getTimezoneOffset(),
                endDateOffset: -1 * data.dateRange.endDate.getTimezoneOffset(),
              });
            }
          })}>
          <div className="h-full px-1">
            <DialogHeader
              title={
                currentlyEditingOutOfOfficeEntry ? t("edit_an_out_of_office") : t("create_an_out_of_office")
              }
            />

            <div>
              <p className="text-emphasis mb-1 block text-sm font-medium capitalize">{t("dates")}</p>
              <div>
                <Controller
                  name="dateRange"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <DateRangePicker
                      minDate={null}
                      dates={{ startDate: value.startDate, endDate: value.endDate }}
                      onDatesChange={(values) => {
                        onChange(values);
                      }}
                      strictlyBottom={true}
                      allowPastDates={true}
                    />
                  )}
                />
              </div>

              {/* Holiday overlap warning */}
              {overlappingHolidays.length > 0 && (
                <Alert
                  className="mt-2"
                  severity="info"
                  title={t("holiday_overlap_info")}
                  message={
                    overlappingHolidays.length === 1
                      ? t("holiday_overlap_message_single", {
                          holiday: overlappingHolidays[0].holiday.name,
                          date: dayjs(overlappingHolidays[0].date).format("D MMM"),
                        })
                      : t("holiday_overlap_message_multiple", {
                          count: overlappingHolidays.length,
                          holidays: overlappingHolidays
                            .slice(0, 3)
                            .map((h) => h.holiday.name)
                            .join(", "),
                        })
                  }
                />
              )}
            </div>

            {/* Reason Select */}
            <div className="mt-4 w-full">
              <div className="">
                <p className="text-emphasis block text-sm font-medium">{t("reason")}</p>
                <Controller
                  control={control}
                  name="reasonId"
                  render={({ field: { onChange, value } }) => (
                    <Select<Option>
                      className="mb-0 mt-1 text-white"
                      name="reason"
                      data-testid="reason_select"
                      menuPlacement="bottom"
                      value={reasonList.find((reason) => reason.value === value)}
                      placeholder={t("ooo_select_reason")}
                      options={reasonList}
                      onChange={(selectedOption) => {
                        if (selectedOption?.value) {
                          onChange(selectedOption.value);
                        }
                      }}
                    />
                  )}
                />
              </div>
            </div>
          </div>
          <DialogFooter showDivider noSticky>
            <div className="flex">
              <Button
                color="minimal"
                type="button"
                onClick={() => {
                  closeModal();
                }}
                className="mr-1">
                {t("cancel")}
              </Button>
              <Button
                form="create-or-edit-ooo-form"
                color="primary"
                type="submit"
                disabled={isSubmitting || isReasonListPending}
                data-testid="create-or-edit-entry-ooo-redirect">
                {currentlyEditingOutOfOfficeEntry ? t("save") : t("create")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
