import { z } from 'zod';

/** Envelope of a PayMongo webhook event. Inner resource is validated by each handler. */
export const paymongoEventSchema = z.object({
  data: z.object({
    id: z.string().regex(/^evt_[A-Za-z0-9]{1,64}$/),
    type: z.literal('event'),
    attributes: z.object({
      type: z.string().min(1).max(100),
      livemode: z.boolean(),
      data: z.unknown(),
    }),
  }),
});

export type PaymongoEvent = z.infer<typeof paymongoEventSchema>;
