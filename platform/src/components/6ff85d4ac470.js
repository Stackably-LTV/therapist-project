import { z } from 'zod';
/** Reminder settings payload accepted by PUT /api/therapist/reminder-settings. */
export const reminderSettingsSchema = z.object({
    enabled: z.boolean(),
    offsets_minutes: z
        .array(z.number().int().min(5).max(20160))
        .min(0)
        .max(8),
    subject: z.string().min(1).max(200),
    body_md: z.string().min(1).max(10_000),
});
