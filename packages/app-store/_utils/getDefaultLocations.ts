import type { z } from "zod";

import { getUsersCredentialsIncludeServiceAccountKey } from "@calcom/app-store/delegationCredential";
import type { Prisma } from "@calcom/prisma/client";
import { userMetadata as userMetadataSchema, type eventTypeLocations } from "@calcom/prisma/zod-utils";

import { MeetLocationType } from "../constants";
import getApps from "../utils";

type EventTypeLocation = z.infer<typeof eventTypeLocations>[number];

type User = {
  id: number;
  email: string;
  metadata: Prisma.JsonValue;
};

export async function getDefaultLocations(user: User): Promise<EventTypeLocation[]> {
  const defaultConferencingData = userMetadataSchema.parse(user.metadata)?.defaultConferencingApp;

  if (defaultConferencingData && defaultConferencingData.appSlug !== "google-meet") {
    // We are not returning the credential, so we are fine with the service account key
    const credentials = await getUsersCredentialsIncludeServiceAccountKey(user);

    const foundApp = getApps(credentials, true).filter(
      (app) => app.slug === defaultConferencingData.appSlug
    )[0]; // There is only one possible install here so index [0] is the one we are looking for ;
    const locationType = foundApp?.locationOption?.value ?? MeetLocationType;
    return [{ type: locationType, link: defaultConferencingData.appLink }];
  }

  return [{ type: MeetLocationType }];
}
