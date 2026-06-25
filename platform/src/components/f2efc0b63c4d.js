import { z } from 'zod';
/** Query params for group discovery, parsed from the request URL. */
export const discoverGroupsParamsSchema = z.object({
    q: z.string().default(''),
    popularLimit: z.coerce.number().int().default(12),
    suggestionsLimit: z.coerce.number().int().default(40),
});
