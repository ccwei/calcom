import type { TrpcSessionUser } from "@calcom/trpc/server/types";
import { checkIfOrgNeedsUpgradeHandler } from "../organizations/checkIfOrgNeedsUpgrade.handler";
import { getUpgradeableHandler } from "../teams/getUpgradeable.handler";
import { checkInvalidAppCredentials } from "./checkForInvalidAppCredentials";
import { getDueInvoiceBannerDataHandler } from "./getDueInvoiceBannerData.handler";
import { shouldVerifyEmailHandler } from "./shouldVerifyEmail.handler";

type Props = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
};

export const getUserTopBannersHandler = async ({ ctx }: Props) => {
  const upgradeableTeamMememberships = getUpgradeableHandler({ userId: ctx.user.id });
  const upgradeableOrgMememberships = checkIfOrgNeedsUpgradeHandler({ ctx });
  const shouldEmailVerify = shouldVerifyEmailHandler({ ctx });
  const appsWithInavlidCredentials = checkInvalidAppCredentials({ ctx });
  const dueInvoiceBannerData = getDueInvoiceBannerDataHandler({ ctx });

  const [
    teamUpgradeBanner,
    orgUpgradeBanner,
    verifyEmailBanner,
    invalidAppCredentialBanners,
    dueInvoiceBanner,
  ] = await Promise.allSettled([
    upgradeableTeamMememberships,
    upgradeableOrgMememberships,
    shouldEmailVerify,
    appsWithInavlidCredentials,
    dueInvoiceBannerData,
  ]);

  return {
    teamUpgradeBanner: teamUpgradeBanner.status === "fulfilled" ? teamUpgradeBanner.value : [],
    orgUpgradeBanner: orgUpgradeBanner.status === "fulfilled" ? orgUpgradeBanner.value : [],
    verifyEmailBanner: verifyEmailBanner.status === "fulfilled" ? !verifyEmailBanner.value.isVerified : false,
    // Live Google checks were removed in cal.diy#21908. They ran on every banner load.
    // Reconnect warnings come from Credential.invalid via invalidAppCredentialBanners.
    calendarCredentialBanner: false,
    invalidAppCredentialBanners:
      invalidAppCredentialBanners.status === "fulfilled" ? invalidAppCredentialBanners.value : [],
    dueInvoiceBanner: dueInvoiceBanner.status === "fulfilled" ? dueInvoiceBanner.value : [],
  };
};
