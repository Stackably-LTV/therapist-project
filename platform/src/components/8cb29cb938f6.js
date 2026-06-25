import { z } from 'zod';
export const createConsultationRequestSchema = z.object({
    therapist_id: z.string().uuid(),
    seeker_id: z.string().uuid(),
    initiated_by: z.enum(['therapist', 'seeker']).default('seeker'),
    initial_message: z.string().max(5000).optional(),
});
export const consultationResponseStatusSchema = z.enum(['accepted', 'declined']);
