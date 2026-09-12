"use client";

import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useForm } from "react-hook-form";

import { DEFAULT_SCHEDULE } from "@calcom/lib/availability";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { localStorage } from "@calcom/lib/webstorage";
import { trpc } from "@calcom/trpc/react";
import type { AppRouter } from "@calcom/trpc/types/server/routers/_app";
import { Button } from "@calcom/ui/components/button";
import { Form } from "@calcom/ui/components/form";
import { showToast } from "@calcom/ui/components/toast";
import Schedule from "@calcom/web/modules/schedules/components/Schedule";

import type { TRPCClientErrorLike } from "@trpc/client";

interface ISetupAvailabilityProps {
  defaultScheduleId?: number | null;
}

const SetupAvailability = (props: ISetupAvailabilityProps) => {
  const { defaultScheduleId } = props;

  const { t } = useLocale();
  const router = useRouter();
  const utils = trpc.useUtils();

  const scheduleId = defaultScheduleId === null ? undefined : defaultScheduleId;
  const queryAvailability = trpc.viewer.availability.schedule.get.useQuery(
    { scheduleId: defaultScheduleId ?? undefined },
    {
      enabled: !!scheduleId,
    }
  );

  const { data: eventTypes } = trpc.viewer.eventTypes.list.useQuery();
  const createEventType = trpc.viewer.eventTypesHeavy.create.useMutation();

  const availabilityForm = useForm({
    defaultValues: {
      schedule: queryAvailability?.data?.availability || DEFAULT_SCHEDULE,
    },
  });

  const DEFAULT_EVENT_TYPES = [
    {
      title: t("30min_meeting"),
      slug: "30min",
      length: 30,
    },
  ];

  const completeOnboarding = trpc.viewer.me.updateProfile.useMutation({
    onSuccess: async () => {
      try {
        if (eventTypes?.length === 0) {
          await Promise.all(
            DEFAULT_EVENT_TYPES.map(async (event) => {
              return createEventType.mutate(event);
            })
          );
        }
      } catch (error) {
        console.error(error);
      }

      posthog.capture("onboarding_completed");

      await utils.viewer.me.get.refetch();
      const redirectUrl = localStorage.getItem("onBoardingRedirect");
      localStorage.removeItem("onBoardingRedirect");
      redirectUrl ? router.push(redirectUrl) : router.push("/");
    },
    onError: () => {
      showToast(t("problem_saving_user_profile"), "error");
    },
  });

  const mutationOptions = {
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      throw new Error(error.message);
    },
    onSuccess: () => {
      completeOnboarding.mutate({
        completedOnboarding: true,
      });
    },
  };
  const createSchedule = trpc.viewer.availability.schedule.create.useMutation(mutationOptions);
  const updateSchedule = trpc.viewer.availability.schedule.update.useMutation(mutationOptions);
  return (
    <Form
      form={availabilityForm}
      handleSubmit={async (values) => {
        try {
          if (defaultScheduleId) {
            await updateSchedule.mutateAsync({
              scheduleId: defaultScheduleId,
              name: t("default_schedule_name"),
              ...values,
            });
          } else {
            await createSchedule.mutateAsync({
              name: t("default_schedule_name"),
              ...values,
            });
          }
        } catch (error) {
          if (error instanceof Error) {
            // setError(error);
            // @TODO: log error
          }
        }
      }}>
      <div className="bg-default dark:text-inverted text-emphasis border-subtle w-full rounded-md border">
        <Schedule control={availabilityForm.control} name="schedule" weekStart={1} />
      </div>

      <div>
        <Button
          EndIcon="arrow-right"
          data-testid="save-availability"
          type="submit"
          className="mt-2 w-full justify-center p-2 text-sm sm:mt-8"
          loading={availabilityForm.formState.isSubmitting || completeOnboarding.isPending}
          disabled={availabilityForm.formState.isSubmitting || completeOnboarding.isPending}>
          {t("finish_and_start")}
        </Button>
      </div>
    </Form>
  );
};

export { SetupAvailability };
