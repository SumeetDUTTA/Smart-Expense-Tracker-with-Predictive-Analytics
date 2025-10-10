import { z } from 'zod';

export const predictSchema = z.object({
    body: z.object({
        horizonDates: z.coerce.number().min(1).max(12).default(1),
    }).optional().default({ horizonDates: 1 }),
    params: z.object({}).optional().default({}),
    query: z.object({}).optional().default({}),
});