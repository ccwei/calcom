import ServerTrans from "@calcom/lib/components/ServerTrans";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import classNames from "@calcom/ui/classNames";
import Link from "next/link";
import type { ReactElement } from "react";

type ConnectGoogleMeetPromptProps = {
  className?: string;
};

const ConnectGoogleMeetPrompt = ({ className }: ConnectGoogleMeetPromptProps): ReactElement => {
  const { t } = useLocale();

  return (
    <p className={classNames("text-default text-sm", className)}>
      <ServerTrans
        t={t}
        i18nKey="connect_google_meet_required"
        components={[
          <Link
            key="connect_google_meet"
            className="cursor-pointer text-blue-500 underline"
            href="/apps/google-meet">
            Connect Google Meet
          </Link>,
        ]}
      />
    </p>
  );
};

export default ConnectGoogleMeetPrompt;
