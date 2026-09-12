import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";

import { useIsPlatform } from "@calcom/atoms/hooks/useIsPlatform";
import { createEventTypeInput } from "@calcom/features/eventtypes/lib/types";
import { MAX_EVENT_DURATION_MINUTES, MIN_EVENT_DURATION_MINUTES } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import slugify from "@calcom/lib/slugify";
import { Form } from "@calcom/ui/components/form";
import { TextField } from "@calcom/ui/components/form";
import { Tooltip } from "@calcom/ui/components/tooltip";
import type { z } from "zod";

type CreateEventTypeFormValues = z.infer<typeof createEventTypeInput>;

export default function CreateEventTypeForm({
  form,
  isManagedEventType,
  handleSubmit,
  pageSlug,
  isPending,
  urlPrefix,
  SubmitButton,
}: {
  form: UseFormReturn<CreateEventTypeFormValues>;
  isManagedEventType: boolean;
  handleSubmit: (values: CreateEventTypeFormValues) => void;
  pageSlug?: string;
  isPending: boolean;
  urlPrefix?: string;
  SubmitButton: (isPending: boolean) => ReactNode;
}) {
  const isPlatform = useIsPlatform();
  const { t } = useLocale();

  const { register } = form;
  return (
    <Form
      form={form}
      handleSubmit={(values) => {
        handleSubmit(values);
      }}>
      <div className="mt-3 stack-y-6 pb-11">
        <TextField
          label={t("title")}
          placeholder={t("quick_chat")}
          data-testid="event-type-quick-chat"
          {...register("title")}
          onChange={(e) => {
            form.setValue("title", e?.target.value);
            if (form.formState.touchedFields["slug"] === undefined) {
              form.setValue("slug", slugify(e?.target.value));
            }
          }}
        />

        {urlPrefix && urlPrefix.length >= 21 ? (
          <div>
            <TextField
              label={isPlatform ? "Slug" : `${t("url")}: ${urlPrefix}`}
              required
              addOnLeading={
                !isPlatform ? (
                  <span className="max-w-24 md:max-w-56 inline-block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                    {`/${!isManagedEventType ? pageSlug : t("username_placeholder")}/`}
                  </span>
                ) : undefined
              }
              containerClassName="[&>div]:gap-0"
              className="pl-0"
              {...register("slug")}
              onChange={(e) => {
                form.setValue("slug", slugify(e?.target.value), { shouldTouch: true });
              }}
            />

            {isManagedEventType && !isPlatform && (
              <p className="mt-2 text-sm text-gray-600">{t("managed_event_url_clarification")}</p>
            )}
          </div>
        ) : (
          <div>
            <TextField
              label={isPlatform ? "Slug" : t("url")}
              required
              addOnLeading={
                !isPlatform ? (
                  <Tooltip
                    content={`${urlPrefix}/${!isManagedEventType ? pageSlug : t("username_placeholder")}/`}>
                    <span className="max-w-24 md:max-w-56 inline-block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                      {`${urlPrefix}/${!isManagedEventType ? pageSlug : t("username_placeholder")}/`}
                    </span>
                  </Tooltip>
                ) : undefined
              }
              containerClassName="[&>div]:gap-0"
              className="pl-0"
              {...register("slug")}
              onChange={(e) => {
                form.setValue("slug", slugify(e?.target.value), { shouldTouch: true });
              }}
            />
            {isManagedEventType && !isPlatform && (
              <p className="mt-2 text-sm text-gray-600">{t("managed_event_url_clarification")}</p>
            )}
          </div>
        )}
        <div className="relative">
          <TextField
            type="number"
            required
            min={MIN_EVENT_DURATION_MINUTES}
            max={MAX_EVENT_DURATION_MINUTES}
            placeholder="15"
            label={t("duration")}
            className="pr-4"
            {...register("length", {
              valueAsNumber: true,
              min: {
                value: MIN_EVENT_DURATION_MINUTES,
                message: t("duration_min_error", { min: MIN_EVENT_DURATION_MINUTES }),
              },
              max: {
                value: MAX_EVENT_DURATION_MINUTES,
                message: t("duration_max_error", { max: MAX_EVENT_DURATION_MINUTES }),
              },
            })}
            addOnSuffix={t("minutes").toLowerCase()}
          />
        </div>
      </div>
      {SubmitButton(isPending)}
    </Form>
  );
}
