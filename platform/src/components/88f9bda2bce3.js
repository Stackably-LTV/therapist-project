import { z } from 'zod';
/** Query params for the seeker-facing availability endpoint. */
export const availabilityQuerySchema = z.object({
    date: z.string().nullable().optional(),
    tzOffsetMinutes: z.number(),
    startDateKey: z.string().nullable().optional(),
    endDateKey: z.string().nullable().optional(),
});
/** Body for creating a booking (seeker self-scheduling). */
export const createBookingSchema = z.object({
    therapistId: z.string(),
    scheduledAt: z.string(),
    durationMinutes: z.number(),
    sessionDataJson: z.record(z.string(), z.unknown()).nullable().optional(),
    tzOffsetMinutes: z.number().optional(),
});
/** Body for creating a calendar block. */
export const createCalendarBlockSchema = z.object({
    startAt: z.string().nullable().optional(),
    endAt: z.string().nullable().optional(),
    kind: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
});
/** Body for updating a calendar block. */
export const updateCalendarBlockSchema = z.object({
    startAt: z.string().nullable().optional(),
    endAt: z.string().nullable().optional(),
    kind: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
});
/** Body for sending booking confirmation emails. */
export const sendBookingEmailsSchema = z.object({
    sessionId: z.string(),
});
