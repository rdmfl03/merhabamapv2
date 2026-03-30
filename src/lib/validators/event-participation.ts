import { z } from "zod";

export const toggleEventParticipationSchema = z.object({
  locale: z.enum(["de", "tr"]),
  returnPath: z.string().min(1),
  eventId: z.string().min(1),
  intent: z.enum(["interested", "going"]),
});
