import { z } from 'zod';
/** Body for POST /api/auth/reset-password. */
export const resetPasswordSchema = z.object({
    email: z.string().min(1, 'Email is required'),
});
