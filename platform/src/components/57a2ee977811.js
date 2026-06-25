import { z } from 'zod';
/**
 * Input for starting a therapist subscription Checkout. Accepts JSON or form
 * posts; `successPath`/`cancelPath` are optional internal redirect targets that
 * the service sanitises against open-redirects.
 */
export const subscriptionCheckoutSchema = z.object({
    tierCode: z.string().trim().min(1, 'Tier code is required'),
    successPath: z.string().nullable().optional().default(null),
    cancelPath: z.string().nullable().optional().default(null),
});
