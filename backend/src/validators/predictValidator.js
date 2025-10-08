import { z } from 'zod';

export const predictSchema = z.object({
    body: z.object({
        horizonDates: z.number().min(1).max(12).optional().default(1),
    }).optional().default({ horizonDates: 1 }),
    params: z.object({}).optional().default({}),
    query: z.object({}).optional().default({}),
});