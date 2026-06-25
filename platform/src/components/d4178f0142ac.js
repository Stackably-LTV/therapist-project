import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { computeAvailability, getUtcRangeForLocalDateKeys, } from '@/components/bd3f7f04e5ec';
import { resolveBookingPayoutGate } from '@/components/73ba0fd5210e';
import { ok, fail } from '@/components/7ff049787825';
/**
 * Compute self-booking availability for a therapist over a date or date range,
 * as seen by a seeker. Mirrors the original route: validates the timezone/date
 * inputs, checks the therapist's role/profile, payout readiness and booking
 * settings, then returns the bookable date keys and slots.
 */
export async function getTherapistAvailability(args) {
    const { seekerId, therapistId, date, tzOffsetMinutesRaw, startDateKey, endDateKey } = args;
    const supabase = await createClient();
    let rangeStart = null;
    let rangeEnd = null;
    let startKey = null;
    let endKey = null;
    const tzOffsetMinutes = tzOffsetMinutesRaw ? Number(tzOffsetMinutesRaw) : new Date().getTimezoneOffset();
    if (Number.isNaN(tzOffsetMinutes)) {
        return fail(400, 'Invalid tzOffsetMinutes');
    }
    if (date) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
        if (!match) {
            return fail(400, 'Invalid date');
        }
        startKey = date;
        endKey = date;
        const range = getUtcRangeForLocalDateKeys(startKey, endKey, tzOffsetMinutes);
        rangeStart = range.rangeStart;
        rangeEnd = range.rangeEnd;
    }
    else if (startDateKey && endDateKey) {
        startKey = startDateKey;
        endKey = endDateKey;
        const range = getUtcRangeForLocalDateKeys(startKey, endKey, tzOffsetMinutes);
        rangeStart = range.rangeStart;
        rangeEnd = range.rangeEnd;
    }
    else {
        return fail(400, 'Provide either date or startDateKey+endDateKey (with tzOffsetMinutes)');
    }
    // Look up therapist role + profile
    const { data: roleRow } = await supabase
        .from('user_roles')
        .select('id, role, status, created_at')
        .eq('id', therapistId)
        .maybeSingle();
    if (!roleRow || roleRow.role !== 'therapist' || roleRow.status !== 'active') {
        return fail(404, 'Therapist not found');
    }
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', therapistId)
        .maybeSingle();
    const profileAny = (profile ?? {});
    const availability = profileAny.availability || [];
    const sessionDuration = parseInt(String(profileAny.session_duration ?? profileAny.sessionDuration ?? '60'));
    const allowSelfBooking = typeof profileAny.allow_self_booking === 'boolean' ? profileAny.allow_self_booking : true;
    const calendarVisible = typeof profileAny.calendar_visible === 'boolean' ? profileAny.calendar_visible : true;
    const contactFlow = allowSelfBooking ? 'self_booking' : 'consultation_first';
    const therapistName = profileAny.full_name || 'Therapist';
    const therapistRate = Number(profileAny.rate ?? 100);
    const { data: acceptedRequest } = await supabase
        .from('connection_requests')
        .select('id')
        .eq('seeker_id', seekerId)
        .eq('therapist_id', therapistId)
        .eq('status', 'accepted')
        .maybeSingle();
    // Payout setup only blocks therapists who actually charge (billing tier + rate).
    const payoutGate = await resolveBookingPayoutGate(therapistId, profileAny.rate);
    const payoutReady = !payoutGate.blocked;
    let bookingEnabled = calendarVisible && (allowSelfBooking || Boolean(acceptedRequest));
    let bookingDisabledReason = !calendarVisible
        ? 'This therapist is not offering self-scheduling right now.'
        : payoutGate.blocked
            ? payoutGate.message
            : bookingEnabled
                ? ''
                : 'This therapist prefers consultation-first scheduling. Message them first to coordinate an appointment.';
    bookingEnabled = bookingEnabled && payoutReady;
    const weeklyAvailability = availability
        .map((a) => ({
        dayOfWeek: Number(a.dayOfWeek),
        startTime: String(a.startTime || ''),
        endTime: String(a.endTime || ''),
    }))
        .filter((a) => Number.isFinite(a.dayOfWeek) && a.startTime && a.endTime);
    const minInfo = computeAvailability({
        startDateKey: startKey,
        endDateKey: endKey,
        tzOffsetMinutes,
        weeklyAvailability,
        sessionDurationMinutes: sessionDuration,
        therapistCreatedAt: roleRow.created_at ?? null,
        bookedSlotIsos: [],
        nowMs: Date.now(),
    });
    if (!bookingEnabled) {
        return ok({
            therapist: {
                id: therapistId,
                name: therapistName,
                sessionDuration,
                rate: therapistRate,
                contactFlow,
                allowSelfBooking,
                calendarVisible,
            },
            bookingEnabled: false,
            bookingDisabledReason,
            minBookableDateKey: minInfo.minBookableDateKey,
            availableDateKeys: [],
            availableSlots: [],
        });
    }
    const { data: bookedSessions } = await supabase
        .from('appointments')
        .select('scheduled_at, status')
        .eq('therapist_id', therapistId)
        .gte('scheduled_at', rangeStart.toISOString())
        .lt('scheduled_at', rangeEnd.toISOString());
    const bookedSlots = new Set((bookedSessions ?? [])
        .filter((s) => s.status === 'scheduled' || s.status === 'in_progress' || s.status === 'pending_payment')
        .map((s) => new Date(s.scheduled_at).toISOString()));
    const slotsInfo = computeAvailability({
        startDateKey: startKey,
        endDateKey: endKey,
        tzOffsetMinutes,
        weeklyAvailability,
        sessionDurationMinutes: sessionDuration,
        therapistCreatedAt: roleRow.created_at ?? null,
        bookedSlotIsos: Array.from(bookedSlots.values()),
        nowMs: Date.now(),
    });
    return ok({
        therapist: {
            id: therapistId,
            name: therapistName,
            sessionDuration,
            rate: therapistRate,
            contactFlow,
            allowSelfBooking,
            calendarVisible,
        },
        bookingEnabled: true,
        minBookableDateKey: slotsInfo.minBookableDateKey,
        availableDateKeys: slotsInfo.availableDateKeys,
        availableSlots: slotsInfo.availableSlots,
    });
}
