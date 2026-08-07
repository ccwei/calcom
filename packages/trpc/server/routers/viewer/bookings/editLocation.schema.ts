import { z } from "zod";

import { MeetLocationType } from "@calcom/app-store/constants";

import { commonBookingSchema } from "./types";

export const ZEditLocationInputSchema = commonBookingSchema.extend({
  newLocation: z.string().transform((val) => val || MeetLocationType),
  credentialId: z.number().nullable(),
});

export type TEditLocationInputSchema = z.infer<typeof ZEditLocationInputSchema>;
