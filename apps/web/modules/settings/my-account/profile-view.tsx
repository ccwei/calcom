"use client";

import { Dialog } from "@calcom/features/components/controlled-dialog";
import SettingsHeader from "@calcom/features/settings/appDir/SettingsHeader";
import SectionBottomActions from "@calcom/features/settings/SectionBottomActions";
import { APP_NAME, FULL_NAME_LENGTH_MAX_LIMIT } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { IdentityProvider } from "@calcom/prisma/enums";
import type { RouterOutputs } from "@calcom/trpc/react";
import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui/components/button";
import { DialogClose, DialogContent, DialogFooter } from "@calcom/ui/components/dialog";
import { Form, Label, TextField } from "@calcom/ui/components/form";
import { showToast } from "@calcom/ui/components/toast";
import { DisplayInfo } from "@calcom/web/modules/users/components/UserTable/EditSheet/DisplayInfo";
import { zodResolver } from "@hookform/resolvers/zod";
import { revalidateSettingsProfile } from "app/cache/path/settings/my-account";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type FormValues = {
  name: string;
};

type Props = {
  user: RouterOutputs["viewer"]["me"]["get"];
};

const ProfileView = ({ user }: Props) => {
  const { t } = useLocale();
  const utils = trpc.useUtils();
  const session = useSession();
  const { update } = session;
  const [showCreateAccountPasswordDialog, setShowCreateAccountPasswordDialog] = useState(false);
  const [showAccountDisconnectWarning, setShowAccountDisconnectWarning] = useState(false);

  const updateProfileMutation = trpc.viewer.me.updateProfile.useMutation({
    onSuccess: async (res) => {
      await update(res);
      utils.viewer.me.invalidate();
      utils.viewer.me.shouldVerifyEmail.invalidate();
      revalidateSettingsProfile();
      showToast(t("settings_updated_successfully"), "success");
    },
    onError: () => {
      showToast(t("error_updating_settings"), "error");
    },
  });

  const unlinkConnectedAccountMutation = trpc.viewer.loggedInViewerRouter.unlinkConnectedAccount.useMutation({
    onSuccess: async (res) => {
      showToast(t(res.message), "success");
      utils.viewer.me.invalidate();
      revalidateSettingsProfile();
    },
    onError: (e) => {
      showToast(t(e.message), "error");
    },
  });

  const isCALIdentityProvider = user?.identityProvider === IdentityProvider.CAL;
  const defaultValues = {
    name: user.name || "",
  };

  return (
    <SettingsHeader
      title={t("profile")}
      description={t("profile_description", { appName: APP_NAME })}
      borderInShellHeader={true}>
      <ProfileForm
        key={JSON.stringify(defaultValues)}
        defaultValues={defaultValues}
        isPending={updateProfileMutation.isPending}
        user={user}
        onSubmit={(values) => {
          updateProfileMutation.mutate(values);
        }}
        handleAccountDisconnect={() => {
          if (isCALIdentityProvider) return;
          if (user?.passwordAdded) {
            setShowAccountDisconnectWarning(true);
            return;
          }
          setShowCreateAccountPasswordDialog(true);
        }}
        isCALIdentityProvider={isCALIdentityProvider}
      />

      <Dialog open={showCreateAccountPasswordDialog} onOpenChange={setShowCreateAccountPasswordDialog}>
        <DialogContent
          title={t("create_account_password")}
          description={t("create_account_password_hint")}
          type="creation"
          Icon="triangle-alert">
          <DialogFooter>
            <DialogClose />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAccountDisconnectWarning} onOpenChange={setShowAccountDisconnectWarning}>
        <DialogContent
          title={t("disconnect_account")}
          description={t("disconnect_account_hint")}
          type="creation"
          Icon="triangle-alert">
          <DialogFooter>
            <Button
              color="primary"
              onClick={() => {
                unlinkConnectedAccountMutation.mutate();
                setShowAccountDisconnectWarning(false);
              }}>
              {t("confirm")}
            </Button>
            <DialogClose />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsHeader>
  );
};

const ProfileForm = ({
  defaultValues,
  onSubmit,
  handleAccountDisconnect,
  isPending = false,
  user,
  isCALIdentityProvider,
}: {
  defaultValues: FormValues;
  onSubmit: (values: FormValues) => void;
  handleAccountDisconnect: () => void;
  isPending: boolean;
  user: RouterOutputs["viewer"]["me"]["get"];
  isCALIdentityProvider: boolean;
}) => {
  const { t } = useLocale();

  const profileFormSchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, t("you_need_to_add_a_name"))
      .max(FULL_NAME_LENGTH_MAX_LIMIT, {
        message: t("max_limit_allowed_hint", {
          limit: FULL_NAME_LENGTH_MAX_LIMIT,
        }),
      }),
  });

  const formMethods = useForm<FormValues>({
    defaultValues,
    resolver: zodResolver(profileFormSchema),
  });

  const { data: usersAttributes } = trpc.viewer.attributes.getByUserId.useQuery({
    userId: user.id,
  });

  const {
    formState: { isSubmitting, isDirty },
  } = formMethods;

  const isDisabled = isSubmitting || !isDirty;

  return (
    <Form form={formMethods} handleSubmit={onSubmit}>
      <div className="border-subtle border-x px-4 pb-10 pt-8 sm:px-6">
        <div>
          <TextField label={t("full_name")} {...formMethods.register("name")} />
        </div>
        {usersAttributes && usersAttributes?.length > 0 && (
          <div className="mt-6 flex flex-col">
            <Label>{t("attributes")}</Label>
            <div className="stack-y-4 flex flex-col">
              {usersAttributes.map((attribute, index) => (
                <DisplayInfo
                  key={index}
                  label={attribute.name}
                  labelClassname="font-normal text-sm text-subtle"
                  valueClassname="text-emphasis inline-flex items-center gap-1 font-normal text-sm leading-5"
                  value={
                    ["TEXT", "NUMBER", "SINGLE_SELECT"].includes(attribute.type)
                      ? attribute.options[0].value
                      : attribute.options.map((option) => option.value)
                  }
                />
              ))}
            </div>
          </div>
        )}
        {!isCALIdentityProvider && user.email !== user.identityProviderEmail && (
          <div className="mt-6">
            <Label>Connected accounts</Label>
            <div className="flex items-center">
              <span className="text-default text-sm capitalize">{user.identityProvider.toLowerCase()}</span>
              {user.identityProviderEmail && (
                <span className="text-default ml-2 text-sm">{user.identityProviderEmail}</span>
              )}
              <div className="flex flex-1 justify-end">
                <Button color="destructive" onClick={handleAccountDisconnect}>
                  {t("disconnect")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <SectionBottomActions align="end">
        <Button
          loading={isPending}
          disabled={isDisabled}
          color="primary"
          type="submit"
          data-testid="profile-submit-button">
          {t("update")}
        </Button>
      </SectionBottomActions>
    </Form>
  );
};

export default ProfileView;
