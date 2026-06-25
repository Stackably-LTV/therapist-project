'use server';
import { z } from 'zod';
import { createClient, getUser } from '@/components/9a6b39502e62';
import { requireRole } from '@/components/3168fa71d1e4';
import { usNationalDigitsToE164 } from '@/components/98e56006aa84';
/**
 * Partial step-saves for the therapist onboarding wizard.
 *
 * The wizard already persists everything to sessionStorage via Zustand, but
 * sessionStorage is per-tab and per-device. To survive tab closures, refreshes,
 * the Stripe round-trip, and device changes, we also flush each step to
 * Supabase as the therapist progresses. The final submit then becomes a
 * formality that just flips `onboarding_completed = true`.
 *
 * Pending therapists are allowed because the entire onboarding happens while
 * `user_roles.status = 'pending'`.
 */
const Step1Schema = z.object({
    displayName: z.string().trim().min(1).max(120).optional(),
    phoneDigits: z.string().trim().max(10).optional(), // US national digits (0–10 chars)
    profileImageUrl: z.string().trim().max(2048).optional(),
});
const Step3Schema = z.object({
    licenseNumber: z.string().trim().max(120).optional(),
    licensedStates: z.array(z.string().trim().min(2).max(4)).max(60).optional(),
    specialties: z.array(z.string().trim().min(1).max(80)).max(60).optional(),
    yearsExperience: z.number().int().min(0).max(80).optional(),
});
const Step4Schema = z.object({
    rate: z.number().min(0).max(5000).optional(),
    bio: z.string().trim().max(4000).optional(),
    allowSelfBooking: z.boolean().optional(),
    calendarVisible: z.boolean().optional(),
});
const Step5Schema = z.object({
    availability: z
        .array(z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
    }))
        .max(120)
        .optional(),
});
export async function saveTherapistOnboardingStep(input) {
    // Pending therapists must be allowed — onboarding happens entirely pre-approval.
    const auth = await requireRole('therapist', { allowStatuses: ['pending', 'active'] });
    if (!auth.ok) {
        return { ok: false, error: auth.error };
    }
    const user = await getUser();
    if (!user)
        return { ok: false, error: 'Unauthorized' };
    const supabase = await createClient();
    let update = {};
    switch (input.step) {
        case 1: {
            const parsed = Step1Schema.safeParse(input.data);
            if (!parsed.success)
                return { ok: false, error: parsed.error.message };
            const { displayName, phoneDigits, profileImageUrl } = parsed.data;
            if (displayName !== undefined && displayName.length > 0)
                update.full_name = displayName;
            if (phoneDigits !== undefined) {
                update.phone_e164 = phoneDigits.length === 10 ? usNationalDigitsToE164(phoneDigits) : null;
            }
            if (profileImageUrl !== undefined && profileImageUrl.length > 0) {
                update.profile_image_url = profileImageUrl;
            }
            break;
        }
        case 3: {
            const parsed = Step3Schema.safeParse(input.data);
            if (!parsed.success)
                return { ok: false, error: parsed.error.message };
            const { licenseNumber, licensedStates, specialties, yearsExperience } = parsed.data;
            if (licenseNumber !== undefined)
                update.license_number = licenseNumber || null;
            if (licensedStates !== undefined)
                update.licensed_states = licensedStates;
            if (specialties !== undefined)
                update.specialties = specialties;
            if (yearsExperience !== undefined)
                update.years_experience = yearsExperience;
            break;
        }
        case 4: {
            const parsed = Step4Schema.safeParse(input.data);
            if (!parsed.success)
                return { ok: false, error: parsed.error.message };
            const { rate, bio, allowSelfBooking, calendarVisible } = parsed.data;
            if (rate !== undefined)
                update.rate = rate > 0 ? Math.round(rate * 100) / 100 : null;
            if (bio !== undefined)
                update.bio = bio || null;
            if (allowSelfBooking !== undefined)
                update.allow_self_booking = allowSelfBooking;
            if (calendarVisible !== undefined)
                update.calendar_visible = calendarVisible;
            break;
        }
        case 5: {
            const parsed = Step5Schema.safeParse(input.data);
            if (!parsed.success)
                return { ok: false, error: parsed.error.message };
            if (parsed.data.availability !== undefined)
                update.availability = parsed.data.availability;
            break;
        }
        default: {
            const _exhaustive = input;
            void _exhaustive;
            return { ok: false, error: 'Unknown onboarding step' };
        }
    }
    if (Object.keys(update).length === 0) {
        // Nothing to save — caller fired with all-undefined data. Treat as no-op success.
        return { ok: true };
    }
    const { error } = await supabase
        .from('user_profiles')
        .update(update)
        .eq('user_id', user.id);
    if (error) {
        console.error('[saveTherapistOnboardingStep] update failed', { step: input.step, error });
        return { ok: false, error: error.message };
    }
    return { ok: true };
}
