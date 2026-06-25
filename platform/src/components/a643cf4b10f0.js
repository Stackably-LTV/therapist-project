import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { validateScheduledAtAgainstAvailability } from '@/components/bd3f7f04e5ec';
import { getTherapistSubscriptionSummary } from '@/components/c5276438fd9f';
import { resolveBookingPayoutGate } from '@/components/73ba0fd5210e';
import { createSessionPaymentCheckout } from '@/components/f46e04b31ebd';
import { ok, fail } from '@/components/7ff049787825';
/**
 * Create a booking for a seeker against a therapist's calendar. Performs the
 * full set of pre-flight checks (overlap, calendar blocks, role, payout
 * readiness, booking settings, slot validity) and either inserts a confirmed
 * appointment or, when the therapist charges, creates a pending-payment
 * appointment plus a Stripe checkout session.
 */
export async function createBooking(args) {
    const { seekerId, origin } = args;
    const { therapistId, scheduledAt, durationMinutes, sessionDataJson, tzOffsetMinutes } = args;
    if (!therapistId || !scheduledAt || !durationMinutes) {
        return fail(400, 'Missing required fields');
    }
    const supabase = await createClient();
    // Overlap check
    const startMs = new Date(scheduledAt).getTime();
    const endMs = startMs + Number(durationMinutes) * 60_000;
    const probeStart = new Date(startMs - 4 * 60 * 60_000).toISOString();
    const probeEnd = new Date(endMs + 4 * 60 * 60_000).toISOString();
    const { data: nearby } = await supabase
        .from('appointments')
        .select('scheduled_at, duration_minutes, status')
        .eq('therapist_id', therapistId)
        .gte('scheduled_at', probeStart)
        .lt('scheduled_at', probeEnd);
    const hasOverlap = (nearby ?? []).some((s) => {
        if (s.status === 'cancelled' || s.status === 'completed')
            return false;
        const sStart = new Date(s.scheduled_at).getTime();
        const sEnd = sStart + Number(s.duration_minutes ?? 60) * 60_000;
        return sStart < endMs && sEnd > startMs;
    });
    if (hasOverlap) {
        return fail(409, 'This time slot is no longer available');
    }
    // Calendar-block overlap check — therapist may have manually blocked this time off.
    const { data: blocks } = await supabase
        .from('calendar_blocks')
        .select('start_at, end_at')
        .eq('therapist_id', therapistId);
    const conflictsBlock = (blocks ?? []).some((b) => {
        const bStart = new Date(b.start_at).getTime();
        const bEnd = new Date(b.end_at).getTime();
        return bStart < endMs && bEnd > startMs;
    });
    if (conflictsBlock) {
        return fail(409, 'This time is unavailable on the therapist’s calendar.');
    }
    // Therapist role + profile
    const { data: therapistRole } = await supabase
        .from('user_roles')
        .select('id, role, status, created_at')
        .eq('id', therapistId)
        .maybeSingle();
    if (!therapistRole || therapistRole.role !== 'therapist') {
        return fail(404, 'Therapist not found');
    }
    const { data: therapistProfileRow } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', therapistId)
        .maybeSingle();
    const therapistProfile = (therapistProfileRow ?? {});
    const therapistName = therapistProfile.full_name || 'Therapist';
    // Seeker profile (for stripe customer caching, name)
    const { data: seekerProfileRow } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', seekerId)
        .maybeSingle();
    const seekerProfile = (seekerProfileRow ?? {});
    const { data: { user: authUser }, } = await supabase.auth.getUser();
    const seekerEmail = authUser?.email ?? '';
    const seekerName = seekerProfile.full_name || authUser?.user_metadata?.full_name || 'Seeker';
    // Acceptance gate
    const { data: acceptedRequest } = await supabase
        .from('connection_requests')
        .select('id')
        .eq('seeker_id', seekerId)
        .eq('therapist_id', therapistId)
        .eq('status', 'accepted')
        .maybeSingle();
    const allowSelfBooking = typeof therapistProfile.allow_self_booking === 'boolean'
        ? therapistProfile.allow_self_booking
        : true;
    const calendarVisible = typeof therapistProfile.calendar_visible === 'boolean'
        ? therapistProfile.calendar_visible
        : true;
    if (!calendarVisible) {
        return fail(403, 'This therapist is not offering self-scheduling right now.');
    }
    if (!allowSelfBooking && !acceptedRequest) {
        return fail(403, 'This therapist prefers consultation-first scheduling. Message them first to coordinate an appointment.');
    }
    const weeklyAvailabilityRaw = therapistProfile.availability || [];
    const weeklyAvailability = weeklyAvailabilityRaw
        .map((a) => ({
        dayOfWeek: Number(a.dayOfWeek),
        startTime: String(a.startTime || ''),
        endTime: String(a.endTime || ''),
    }))
        .filter((a) => Number.isFinite(a.dayOfWeek) && a.startTime && a.endTime);
    const therapistSessionDuration = parseInt(String(therapistProfile.session_duration ?? therapistProfile.sessionDuration ?? durationMinutes ?? '60'));
    const offset = typeof tzOffsetMinutes === 'number' && !Number.isNaN(tzOffsetMinutes) ? tzOffsetMinutes : 0;
    const slotValidation = validateScheduledAtAgainstAvailability({
        scheduledAtIso: String(scheduledAt),
        durationMinutes: Number(durationMinutes),
        tzOffsetMinutes: offset,
        weeklyAvailability,
        therapistCreatedAt: therapistRole.created_at ?? null,
        therapistSessionDurationMinutes: therapistSessionDuration,
    });
    if (slotValidation.ok === false) {
        return fail(403, slotValidation.reason);
    }
    const subscription = await getTherapistSubscriptionSummary(therapistId);
    const therapistRate = Number(therapistProfile.rate ?? 0);
    const requiresPayment = subscription.features.includes('billing') && therapistRate > 0;
    // Payout setup only gates therapists who actually charge. Free therapists are
    // bookable without a Connect account; charging therapists must be payout-ready.
    const payoutGate = await resolveBookingPayoutGate(therapistId, therapistRate);
    if (payoutGate.blocked) {
        return fail(403, payoutGate.message);
    }
    const baseSessionData = sessionDataJson || {};
    if (!requiresPayment) {
        const { data: created, error: createErr } = await supabase
            .from('appointments')
            .insert({
            seeker_id: seekerId,
            therapist_id: therapistId,
            scheduled_at: scheduledAt,
            duration_minutes: durationMinutes,
            status: 'scheduled',
            location_type: 'telehealth',
            session_data_json: baseSessionData,
        })
            .select('*')
            .single();
        if (createErr) {
            // 23505 = unique constraint violation on the partial index
            if (createErr.code === '23505') {
                return fail(409, 'This time slot is no longer available. Please pick another.');
            }
            return fail(500, createErr.message);
        }
        // Auto-create a patient record so the seeker appears in the therapist's patient list.
        await supabase
            .from('patient_records')
            .upsert({ seeker_id: seekerId, primary_therapist_id: therapistId, created_by: seekerId }, { onConflict: 'seeker_id', ignoreDuplicates: true });
        return ok({
            session: created,
            message: 'Booking created successfully',
        });
    }
    // Pending-payment path
    const { data: pendingSession, error: pendingErr } = await supabase
        .from('appointments')
        .insert({
        seeker_id: seekerId,
        therapist_id: therapistId,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        status: 'pending_payment',
        location_type: 'telehealth',
        session_data_json: {
            ...baseSessionData,
            payment_pending_at: new Date().toISOString(),
        },
    })
        .select('*')
        .single();
    // Auto-create a patient record so the seeker appears in the therapist's patient list.
    if (!pendingErr && pendingSession) {
        await supabase
            .from('patient_records')
            .upsert({ seeker_id: seekerId, primary_therapist_id: therapistId, created_by: seekerId }, { onConflict: 'seeker_id', ignoreDuplicates: true });
    }
    if (pendingErr || !pendingSession) {
        // 23505 = unique constraint violation on the partial index
        if (pendingErr?.code === '23505') {
            return fail(409, 'This time slot is no longer available. Please pick another.');
        }
        return fail(500, pendingErr?.message ?? 'Failed to create session');
    }
    const checkout = await createSessionPaymentCheckout({
        origin,
        sessionId: pendingSession.id,
        therapistId: therapistId,
        seekerId,
        seekerEmail,
        seekerName,
        therapistName,
        therapistRate,
        durationMinutes: Number(durationMinutes),
        baseSessionData,
        successPath: '/seeker/bookings?checkout=success',
        cancelPath: `/seeker/therapists/${therapistId}?book=1&checkout=cancelled`,
    });
    return ok({
        requiresPayment: true,
        sessionId: pendingSession.id,
        billingId: checkout.billingId,
        url: checkout.url,
    });
}
