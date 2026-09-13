import { isAllowedOnlineConferencingLocation } from "@calcom/app-store/locations";
import type { createEventTypeInput } from "@calcom/features/eventtypes/lib/types";
import type { SingleValueLocationOption } from "@calcom/features/form/components/LocationSelect";
import LocationSelect from "@calcom/features/form/components/LocationSelect";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Label } from "@calcom/ui/components/form";
import type { UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { z } from "zod";
import ConnectGoogleMeetPrompt from "./ConnectGoogleMeetPrompt";

type CreateEventTypeFormValues = z.infer<typeof createEventTypeInput>;

type CreateEventTypeLocationFieldProps = {
  form: UseFormReturn<CreateEventTypeFormValues>;
  teamId?: number;
};

const CreateEventTypeLocationField = ({ form, teamId }: CreateEventTypeLocationFieldProps) => {
  const { t } = useLocale();
  const { data: locationOptions, isPending } = trpc.viewer.apps.locationOptions.useQuery({
    teamId,
  });

  const options = (locationOptions ?? [])
    .map((group) => ({
      ...group,
      options: group.options.filter((option) => isAllowedOnlineConferencingLocation(option.value)),
    }))
    .filter((group) => group.options.length > 0);

  const hasOptions = options.some((group) => group.options.length > 0);

  if (isPending) {
    return (
      <div>
        <Label>
          {t("location")}
        </Label>
        <div className="bg-subtle h-9 animate-pulse rounded-md" />
      </div>
    );
  }

  if (!hasOptions) {
    return (
      <div>
        <Label>
          {t("location")}
        </Label>
        <ConnectGoogleMeetPrompt className="mt-1" />
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor="location-select">
        {t("location")}
      </Label>
      <Controller
        name="locations"
        control={form.control}
        render={({ field }) => {
          const selectedType = field.value?.[0]?.type;
          const selectedOption = options
            .flatMap((group) => group.options)
            .find((option) => option.value === selectedType);

          return (
            <LocationSelect
              placeholder={t("select")}
              options={options}
              value={selectedOption ?? null}
              isClearable={false}
              isSearchable={false}
              onChange={(option: SingleValueLocationOption) => {
                if (!option?.value) {
                  return;
                }
                field.onChange([
                  {
                    type: option.value,
                    ...(option.credentialId ? { credentialId: option.credentialId } : {}),
                  },
                ]);
              }}
            />
          );
        }}
      />
    </div>
  );
};

export default CreateEventTypeLocationField;
