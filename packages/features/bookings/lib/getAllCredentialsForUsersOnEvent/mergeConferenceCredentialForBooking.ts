import process from "node:process";
import logger from "@calcom/lib/logger";
import type { PrismaClient } from "@calcom/prisma";
import { credentialForCalendarServiceSelect } from "@calcom/prisma/selects/credential";
import type { CredentialForCalendarService } from "@calcom/types/Credential";

/** Merge telemetry uses `info` so production (default minLevel warn) stays quiet. Use `NEXT_PUBLIC_LOGGER_LEVEL=3` to see these locally. */
const log: ReturnType<typeof logger.getSubLogger> = logger.getSubLogger({
  prefix: ["mergeConferenceCredentialForBooking"],
});

function parseAllowedSharedConferenceCredentialIds(): Set<number> {
  const raw = process.env.ALLOWED_SHARED_CONFERENCE_CREDENTIAL_IDS?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n))
  );
}

function isOrganizerAllowedToUseCredential({
  organizerUserId,
  conferenceCredentialId,
  credentialUserId,
}: {
  organizerUserId: number;
  conferenceCredentialId: number;
  credentialUserId: number | null;
}): { allowed: boolean; reason: "organizer_owns" | "allowlist" | "denied" } {
  if (credentialUserId === organizerUserId) {
    return { allowed: true, reason: "organizer_owns" };
  }

  const allowlist = parseAllowedSharedConferenceCredentialIds();
  if (allowlist.has(conferenceCredentialId)) {
    return { allowed: true, reason: "allowlist" };
  }

  return { allowed: false, reason: "denied" };
}

/**
 * When an event type location pins `credentialId`, `EventManager` must receive that credential in the
 * organizer's credential list. Personal event types do not merge arbitrary credentials by default.
 *
 * Self-host sharing: set `ALLOWED_SHARED_CONFERENCE_CREDENTIAL_IDS` to a comma-separated list of
 * `Credential.id` values (e.g. one team-less or service Zoom row). Any organizer may then use that id
 * on an event type location; treat the allowlist as instance policy.
 */
export async function mergeConferenceCredentialForBookingIfAllowed({
  prismaClient,
  organizerUserId,
  conferenceCredentialId,
  credentials,
}: {
  prismaClient: PrismaClient;
  organizerUserId: number;
  conferenceCredentialId: number | undefined;
  credentials: CredentialForCalendarService[];
}): Promise<CredentialForCalendarService[]> {
  if (conferenceCredentialId == null) {
    const allowlist = parseAllowedSharedConferenceCredentialIds();
    if (allowlist.size > 0) {
      log.debug(
        "sharedConferenceCredential merge: skipped — no pinned conferenceCredentialId on this booking",
        {
          organizerUserId,
          allowlistParsedIds: Array.from(allowlist),
          hint: "Set NEXT_PUBLIC_LOGGER_LEVEL=2 to see this debug line.",
        }
      );
    }
    return credentials;
  }

  const allowlistIds = Array.from(parseAllowedSharedConferenceCredentialIds());
  const envRaw = process.env.ALLOWED_SHARED_CONFERENCE_CREDENTIAL_IDS ?? "";

  log.info("sharedConferenceCredential merge: checking pinned conference credential", {
    conferenceCredentialId,
    organizerUserId,
    credentialCountBefore: credentials.length,
    existingCredentialIds: credentials.map((c) => c.id),
    allowlistEnvRaw: envRaw || "(unset)",
    allowlistParsedIds: allowlistIds,
  });

  if (credentials.some((c) => c.id === conferenceCredentialId)) {
    log.info("sharedConferenceCredential merge: skip — credential already in organizer list", {
      conferenceCredentialId,
    });
    return credentials;
  }

  const credential = await prismaClient.credential.findUnique({
    where: { id: conferenceCredentialId },
    select: credentialForCalendarServiceSelect,
  });

  if (!credential) {
    log.warn("sharedConferenceCredential merge: skip — credential row not found", {
      conferenceCredentialId,
    });
    return credentials;
  }

  const { allowed, reason } = isOrganizerAllowedToUseCredential({
    organizerUserId,
    conferenceCredentialId,
    credentialUserId: credential.userId,
  });

  if (!allowed) {
    log.warn("sharedConferenceCredential merge: skip — not allowed for organizer", {
      conferenceCredentialId,
      organizerUserId,
      credentialOwnerUserId: credential.userId,
      allowlistParsedIds: allowlistIds,
    });
    return credentials;
  }

  const credentialForMerge: CredentialForCalendarService = {
    ...credential,
    delegatedTo: null,
  };

  const merged = [...credentials, credentialForMerge];

  log.info("sharedConferenceCredential merge: merged credential into booking credential list", {
    conferenceCredentialId,
    organizerUserId,
    accessReason: reason,
    credentialAppId: credential.appId,
    credentialType: credential.type,
    credentialCountAfter: merged.length,
  });

  return merged;
}
