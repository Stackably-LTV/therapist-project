import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { agoraService } from '@/components/ad1214aa1aae';
import { getTherapistSubscriptionSummary } from '@/components/c5276438fd9f';
import { isTherapistPayoutReady, getPayoutReadinessMessage } from '@/components/73ba0fd5210e';
import { createSessionPaymentCheckout } from '@/components/f46e04b31ebd';
import { refundService } from '@/components/4345701d22e6';
import { ok, fail } from '@/components/7ff049787825';
/**
 * Schedule a session (appointment) for a therapist with a seeker. Verifies the
 * therapist-seeker relationship, checks for session/calendar-block conflicts,
 * optionally requires payment, provisions a telehealth video channel, and alerts
 * the seeker via in-app message.
 */
export async function createSession(args) {
    const { therapistId, origin, seekerId, scheduledAtRaw, durationMinutes, sessionType, locationType, locationLabel, telehealthUrl, conflictOverrideReason, } = args;
    if (!seekerId)
        return fail(400, 'patientId is required');
    if (!scheduledAtRaw)
        return fail(400, 'scheduledAt is required');
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        return fail(400, 'durationMinutes must be a positive number');
    }
    const startAt = new Date(scheduledAtRaw);
    if (Number.isNaN(startAt.getTime())) {
        return fail(400, 'scheduledAt must be a valid datetime');
    }
    if (startAt.getTime() < Date.now()) {
        return fail(400, 'Cannot schedule sessions in the past');
    }
    const endAt = new Date(startAt.getTime() + durationMinutes * 60000);
    const supabase = await createClient();
    // Verify therapist has relationship with seeker.
    const { data: rel } = await supabase
        .from('patient_records')
        .select('seeker_id, primary_therapist_id')
        .eq('seeker_id', seekerId)
        .maybeSingle();
    let allowed = rel?.primary_therapist_id === therapistId;
    if (!allowed) {
        const { data: prior } = await supabase
            .from('appointments')
            .select('id')
            .eq('therapist_id', therapistId)
            .eq('seeker_id', seekerId)
            .limit(1);
        allowed = !!(prior && prior.length);
    }
    if (!allowed)
        return fail(403, 'Forbidden');
    // Check session overlap.
    const { data: overlap } = await supabase
        .from('appointments')
        .select('id, scheduled_at, duration_minutes')
        .eq('therapist_id', therapistId)
        .neq('status', 'cancelled')
        .gte('scheduled_at', new Date(startAt.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .lte('scheduled_at', endAt.toISOString());
    const sessionConflict = (overlap || []).some((s) => {
        const sStart = new Date(s.scheduled_at).getTime();
        const sEnd = sStart + (s.duration_minutes || 0) * 60000;
        return sStart < endAt.getTime() && sEnd > startAt.getTime();
    });
    if (sessionConflict) {
        return fail(409, 'Session overlaps an existing session');
    }
    // Check calendar block overlap.
    const { data: blocks } = await supabase
        .from('calendar_blocks')
        .select('id')
        .eq('therapist_id', therapistId)
        .lt('start_at', endAt.toISOString())
        .gt('end_at', startAt.toISOString())
        .limit(1);
    const blockConflict = !!(blocks && blocks.length);
    if (blockConflict && !conflictOverrideReason) {
        return {
            ok: false,
            status: 409,
            error: 'Conflicts with a blocked time',
            data: { requiresOverride: true },
        };
    }
    const { data: therapistProfile } = await supabase
        .from('user_profiles')
        .select('full_name, rate')
        .eq('user_id', therapistId)
        .maybeSingle();
    const therapistRate = Number(therapistProfile?.rate ?? 0);
    const subscription = await getTherapistSubscriptionSummary(therapistId);
    const requiresPayment = subscription.features.includes('billing') && therapistRate > 0;
    let seekerEmail = '';
    let seekerName = 'Client';
    if (requiresPayment) {
        const payoutCheck = await isTherapistPayoutReady(therapistId);
        if (!payoutCheck.ready) {
            return fail(403, getPayoutReadinessMessage(payoutCheck.reason));
        }
        const service = createServiceRoleClient();
        const [{ data: seekerAuth }, { data: seekerProfile }] = await Promise.all([
            service.auth.admin.getUserById(seekerId),
            service.from('user_profiles').select('full_name').eq('user_id', seekerId).maybeSingle(),
        ]);
        seekerEmail = seekerAuth?.user?.email ?? '';
        seekerName = seekerProfile?.full_name ?? seekerAuth?.user?.user_metadata?.full_name ?? 'Client';
    }
    const insertPayload = {
        seeker_id: seekerId,
        therapist_id: therapistId,
        scheduled_at: startAt.toISOString(),
        duration_minutes: Math.round(durationMinutes),
        status: requiresPayment ? 'pending_payment' : 'scheduled',
        session_type: sessionType,
        location_type: locationType,
        location_label: locationLabel,
        telehealth_url: telehealthUrl,
        conflict_override_reason: blockConflict ? conflictOverrideReason : null,
        conflict_overridden_by: blockConflict ? therapistId : null,
        conflict_overridden_at: blockConflict ? new Date().toISOString() : null,
        session_data_json: requiresPayment ? { payment_pending_at: new Date().toISOString() } : {},
    };
    const { data: session, error: insertError } = await supabase
        .from('appointments')
        .insert(insertPayload)
        .select('*')
        .single();
    if (insertError || !session) {
        return fail(500, insertError?.message || 'Failed to create session');
    }
    let finalSession = session;
    let paymentUrl = null;
    if (requiresPayment) {
        const checkout = await createSessionPaymentCheckout({
            origin,
            sessionId: session.id,
            therapistId,
            seekerId,
            seekerEmail,
            seekerName,
            therapistName: therapistProfile?.full_name ?? 'Therapist',
            therapistRate,
            durationMinutes: Math.round(durationMinutes),
            baseSessionData: session.session_data_json || {},
            successPath: `/seeker/sessions/${session.id}?checkout=success`,
            cancelPath: `/seeker/sessions/${session.id}?checkout=cancelled`,
        });
        paymentUrl = checkout.url ?? null;
    }
    else if (locationType === 'telehealth') {
        const channelName = agoraService.channelNameForSession(session.id);
        const { data: updated } = await supabase
            .from('appointments')
            .update({
            session_data_json: {
                ...(session.session_data_json || {}),
                video_channel: { channel_name: channelName, created_at: new Date().toISOString() },
            },
        })
            .eq('id', session.id)
            .select('*')
            .single();
        if (updated)
            finalSession = updated;
    }
    // Alert seeker via in-app message.
    try {
        const when = startAt.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
        await supabase.from('messages').insert({
            sender_id: therapistId,
            recipient_id: seekerId,
            content: requiresPayment && paymentUrl
                ? `Session scheduled for ${when} (${Math.round(durationMinutes)} min). Please pay before the session starts: ${paymentUrl}`
                : `Session scheduled for ${when} (${Math.round(durationMinutes)} min).`,
            read_at: null,
        });
    }
    catch (alertErr) {
        console.error('[api/therapist/sessions] alert send failed', alertErr);
    }
    return ok({
        session: finalSession,
        requiresPayment,
        ...(paymentUrl ? { url: paymentUrl } : {}),
    });
}
/**
 * Reschedule / edit an existing session owned by the therapist. Re-validates
 * timing and re-runs conflict checks (excluding the session itself).
 */
export async function updateSession(args) {
    const { therapistId, sessionId } = args;
    const supabase = await createClient();
    const { data: session } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();
    if (!session)
        return fail(404, 'Not found');
    if (session.therapist_id !== therapistId)
        return fail(403, 'Forbidden');
    const scheduledAtRaw = args.scheduledAt ?? session.scheduled_at;
    const durationMinutes = args.durationMinutes == null ? session.duration_minutes : Number(args.durationMinutes);
    const sessionType = args.sessionType ?? session.session_type;
    const locationType = args.locationType ?? session.location_type;
    const locationLabel = args.locationLabel ?? session.location_label;
    const telehealthUrl = args.telehealthUrl ?? session.telehealth_url;
    const conflictOverrideReason = args.conflictOverrideReason;
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        return fail(400, 'durationMinutes must be a positive number');
    }
    const startAt = new Date(scheduledAtRaw);
    if (Number.isNaN(startAt.getTime())) {
        return fail(400, 'scheduledAt must be a valid datetime');
    }
    if (startAt.getTime() < Date.now()) {
        return fail(400, 'Cannot schedule sessions in the past');
    }
    const endAt = new Date(startAt.getTime() + durationMinutes * 60000);
    // Overlap check (excluding self).
    const { data: overlapRows } = await supabase
        .from('appointments')
        .select('id, scheduled_at, duration_minutes')
        .eq('therapist_id', therapistId)
        .neq('id', sessionId)
        .neq('status', 'cancelled')
        .gte('scheduled_at', new Date(startAt.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .lte('scheduled_at', endAt.toISOString());
    const sessionConflict = (overlapRows || []).some((s) => {
        const sStart = new Date(s.scheduled_at).getTime();
        const sEnd = sStart + (s.duration_minutes || 0) * 60000;
        return sStart < endAt.getTime() && sEnd > startAt.getTime();
    });
    if (sessionConflict) {
        return fail(409, 'Session overlaps an existing session');
    }
    const { data: blocks } = await supabase
        .from('calendar_blocks')
        .select('id')
        .eq('therapist_id', therapistId)
        .lt('start_at', endAt.toISOString())
        .gt('end_at', startAt.toISOString())
        .limit(1);
    const blockConflict = !!(blocks && blocks.length);
    if (blockConflict && !conflictOverrideReason) {
        return {
            ok: false,
            status: 409,
            error: 'Conflicts with a blocked time',
            data: { requiresOverride: true },
        };
    }
    const { data: updated, error } = await supabase
        .from('appointments')
        .update({
        scheduled_at: startAt.toISOString(),
        duration_minutes: Math.round(durationMinutes),
        session_type: sessionType,
        location_type: locationType,
        location_label: locationLabel,
        telehealth_url: telehealthUrl,
        conflict_override_reason: blockConflict ? conflictOverrideReason : null,
        conflict_overridden_by: blockConflict ? therapistId : null,
        conflict_overridden_at: blockConflict ? new Date().toISOString() : null,
    })
        .eq('id', sessionId)
        .select('*')
        .maybeSingle();
    if (error)
        return fail(500, error.message);
    if (!updated)
        return fail(500, 'Failed to update');
    return ok({ session: updated });
}
/**
 * Create an immediate ("ad hoc") in-progress telehealth session and provision its
 * video channel. Used to start an unscheduled call with an existing seeker.
 */
export async function createAdHocSession(args) {
    const { therapistId, seekerId } = args;
    const durationMinutesRaw = Number(args.durationMinutes ?? 60);
    const durationMinutes = Number.isFinite(durationMinutesRaw) && durationMinutesRaw > 0
        ? Math.round(durationMinutesRaw)
        : 60;
    if (!seekerId) {
        return fail(400, 'patientId is required');
    }
    const supabase = await createClient();
    const { data: rec } = await supabase
        .from('patient_records')
        .select('primary_therapist_id')
        .eq('seeker_id', seekerId)
        .maybeSingle();
    let allowed = rec?.primary_therapist_id === therapistId;
    if (!allowed) {
        const { data: prior } = await supabase
            .from('appointments')
            .select('id')
            .eq('therapist_id', therapistId)
            .eq('seeker_id', seekerId)
            .limit(1);
        allowed = !!(prior && prior.length);
    }
    if (!allowed)
        return fail(403, 'Forbidden');
    const { data: session, error } = await supabase
        .from('appointments')
        .insert({
        seeker_id: seekerId,
        therapist_id: therapistId,
        scheduled_at: new Date().toISOString(),
        duration_minutes: durationMinutes,
        status: 'in_progress',
        session_type: 'therapy',
        location_type: 'telehealth',
        session_data_json: { origin: 'ad_hoc' },
    })
        .select('*')
        .single();
    if (error || !session) {
        return fail(500, error?.message || 'Failed');
    }
    const channelName = agoraService.channelNameForSession(session.id);
    const { data: updated } = await supabase
        .from('appointments')
        .update({
        session_data_json: {
            ...(session.session_data_json || {}),
            video_channel: { channel_name: channelName, created_at: new Date().toISOString() },
        },
    })
        .eq('id', session.id)
        .select('*')
        .single();
    return ok({ session: updated ?? session });
}
/**
 * Cancel a session booking (therapist-initiated) and process any applicable
 * refund. The refund is best-effort: a refund failure does not fail cancellation.
 */
export async function cancelSession(args) {
    const { therapistId, sessionId, reason } = args;
    const supabase = await createClient();
    // Fetch appointment
    const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('id, therapist_id, status, scheduled_at')
        .eq('id', sessionId)
        .maybeSingle();
    if (fetchError || !appointment) {
        return fail(404, 'Session not found');
    }
    // Verify ownership
    if (appointment.therapist_id !== therapistId) {
        return fail(403, 'Forbidden');
    }
    // Prevent cancelling already cancelled/completed sessions
    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
        return fail(409, `Cannot cancel session with status ${appointment.status}`);
    }
    // Update appointment status
    const { data: updated, error: updateError } = await supabase
        .from('appointments')
        .update({
        status: 'cancelled',
        session_data_json: {
            cancellationReason: reason,
            cancellationInitiatedBy: 'therapist',
            cancelledAt: new Date().toISOString(),
        },
    })
        .eq('id', sessionId)
        .select('*')
        .single();
    if (updateError || !updated) {
        return fail(500, 'Failed to cancel session');
    }
    // Process refund (async, non-blocking)
    let refundResult = null;
    try {
        refundResult = await refundService.processRefundForCancelledAppointment(sessionId);
    }
    catch (refundError) {
        console.error('[api/therapist/sessions/:sessionId/cancel] refund error', refundError);
        // Don't fail the cancellation if refund errors; log and continue
    }
    return ok({
        session: updated,
        refund: refundResult,
    });
}
