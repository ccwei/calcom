import { enrichUserWithDelegationConferencingCredentialsWithoutOrgId } from "@calcom/app-store/delegationCredential";
import { defaultVideoAppCategories } from "@calcom/app-store/utils";
import { buildNonDelegationCredentials } from "@calcom/lib/delegationCredential";
import { prisma } from "@calcom/prisma";
import type { Prisma } from "@calcom/prisma/client";
import { AppCategories } from "@calcom/prisma/enums";
import { credentialForCalendarServiceSelect } from "@calcom/prisma/selects/credential";
import type { TFunction } from "i18next";
import getEnabledAppsFromCredentials from "./_utils/getEnabledAppsFromCredentials";
import { isAllowedOnlineConferencingAppSlug } from "./constants";

export async function getLocationGroupedOptions(
  userOrTeamId: { userId: number } | { teamId: number },
  t: TFunction
) {
  const apps: Record<
    string,
    {
      label: string;
      value: string;
      disabled?: boolean;
      icon?: string;
      slug?: string;
      credentialId?: number;
      supportsCustomLabel?: boolean;
    }[]
  > = {};

  // don't default to {}, when you do TS no longer determines the right types.
  let idToSearchObject: Prisma.CredentialWhereInput;
  let user = null;
  if ("teamId" in userOrTeamId) {
    const teamId = userOrTeamId.teamId;
    // See if the team event belongs to an org
    const org = await prisma.team.findFirst({
      where: {
        children: {
          some: {
            id: teamId,
          },
        },
      },
    });

    if (org) {
      idToSearchObject = {
        teamId: {
          in: [teamId, org.id],
        },
      };
    } else {
      idToSearchObject = { teamId };
    }
  } else {
    idToSearchObject = { userId: userOrTeamId.userId };
    user = await prisma.user.findUnique({
      where: {
        id: userOrTeamId.userId,
      },
    });
  }

  const nonDelegationCredentials = await prisma.credential.findMany({
    where: {
      ...idToSearchObject,
      app: {
        categories: {
          hasSome: defaultVideoAppCategories,
        },
      },
    },
    select: {
      ...credentialForCalendarServiceSelect,
      team: {
        select: {
          name: true,
        },
      },
    },
  });

  let credentials;
  if (user) {
    // We only add delegationCredentials if the request for location options is for a user because DelegationCredential Credential is applicable to Users only.
    const { credentials: allCredentials } = await enrichUserWithDelegationConferencingCredentialsWithoutOrgId(
      {
        user: {
          ...user,
          credentials: nonDelegationCredentials,
        },
      }
    );
    credentials = allCredentials;
  } else {
    // TODO: We can avoid calling buildNonDelegationCredentials here by moving the above prisma query to the repository and doing it there
    credentials = buildNonDelegationCredentials(nonDelegationCredentials);
  }

  const integrations = await getEnabledAppsFromCredentials(credentials, { filterOnCredentials: true });

  integrations.forEach((app) => {
    // Event types only support installed Google Meet and Zoom.
    if (app.locationOption && isAllowedOnlineConferencingAppSlug(app.slug)) {
      // All apps that are labeled as a locationOption are video apps. Extract the secondary category if available
      let groupByCategory =
        app.categories.length >= 2
          ? app.categories.find((groupByCategory) => !defaultVideoAppCategories.includes(groupByCategory))
          : app.categories[0] || app.category;
      if (!groupByCategory) groupByCategory = AppCategories.conferencing;

      for (const { teamName } of app.credentials.map((credential) => ({
        teamName: credential.team?.name,
      }))) {
        const label = `${app.locationOption.label} ${teamName ? `(${teamName})` : ""}`;
        const option = {
          ...app.locationOption,
          label,
          icon: app.logo,
          slug: app.slug,
          ...(app.credential
            ? { credentialId: app.credential.id, teamName: app.credential.team?.name ?? null }
            : {}),
        };
        if (apps[groupByCategory]) {
          const existingOption = apps[groupByCategory].find((o) => o.value === option.value);
          if (!existingOption) {
            apps[groupByCategory] = [...apps[groupByCategory], option];
          }
        } else {
          apps[groupByCategory] = [option];
        }
      }
    }
  });

  const locations = [];

  // Translating labels and pushing into array
  for (const category in apps) {
    const tmp = {
      label: t(category),
      options: apps[category].map((l) => ({
        ...l,
        label: t(l.label),
      })),
    };

    locations.push(tmp);
  }

  return locations;
}
