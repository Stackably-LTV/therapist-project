import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { agoraService } from '@/components/ad1214aa1aae';
import { emailService } from '@/components/b2a0b00fb250';
import { render } from '@react-email/render';
import MessageNotificationEmail from '@/components/c9deb8d8f726';
import { ok, fail } from '@/components/7ff049787825';
function asOptionalString(value) {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
}
async function canAccessSeeker(therapistId, seekerId, supabase) {
    // Formal client relationship
    const { data: record } = await supabase
        .from('patient_records')
        .select('primary_therapist_id')
        .eq('seeker_id', seekerId)
        .maybeSingle();
    if (record?.primary_therapist_id === therapistId)
        return true;
    const { data: appt } = await supabase
        .from('appointments')
        .select('id')
        .eq('therapist_id', therapistId)
        .eq('seeker_id', seekerId)
        .limit(1)
        .maybeSingle();
    if (appt)
        return true;
    // Pre-relationship signals: an exchanged message OR a connection request in
    // either direction (pending or accepted). A therapist can send a session invite
    // to anyone they're already actively talking to or have invited.
    const { data: msg } = await supabase
        .from('messages')
        .select('id')
        .or(`and(sender_id.eq.${therapistId},recipient_id.eq.${seekerId}),and(sender_id.eq.${seekerId},recipient_id.eq.${therapistId})`)
        .limit(1)
        .maybeSingle();
    if (msg)
        return true;
    const { data: req } = await supabase
        .from('connection_requests')
        .select('id, status')
        .eq('therapist_id', therapistId)
        .eq('seeker_id', seekerId)
        .neq('status', 'declined')
        .limit(1)
        .maybeSingle();
    return !!req;
}
/**
 * Create a session invite (appointment) from a therapist to a seeker. Validates
 * the relationship, checks for appointment + calendar-block overlaps, provisions
 * a telehealth channel, and best-effort emails the seeker. Returns the session.
 */
export async function createSessionInvite(therapistId, body) {
    const supabase = await createClient();
    const recipientId = asOptionalString(body?.recipientId);
    const scheduledAtRaw = asOptionalString(body?.scheduledAt);
    const durationMinutes = Number(body?.durationMinutes || 50);
    const sessionType = asOptionalString(body?.sessionType) ?? 'therapy';
    const locationType = asOptionalString(body?.locationType) ?? 'telehealth';
    const locationLabel = asOptionalString(body?.locationLabel);
    const telehealthUrl = asOptionalString(body?.telehealthUrl);
    const note = asOptionalString(body?.note);
    if (!recipientId)
        return fail(400, 'recipientId is required');
    if (!scheduledAtRaw)
        return fail(400, 'scheduledAt is required');
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        return fail(400, 'durationMinutes must be a positive number');
    }
    const allowed = await canAccessSeeker(therapistId, recipientId, supabase);
    if (!allowed)
        return fail(403, 'Forbidden');
    const startAt = new Date(scheduledAtRaw);
    if (Number.isNaN(startAt.getTime())) {
        return fail(400, 'Invalid scheduledAt value');
    }
    const endAt = new Date(startAt.getTime() + durationMinutes * 60000);
    // Overlap check: any appointment for this therapist that overlaps [startAt, endAt)
    const { data: existing } = await supabase
        .from('appointments')
        .select('id, scheduled_at, duration_minutes, status')
        .eq('therapist_id', therapistId)
        .neq('status', 'cancelled');
    const overlap = (existing || []).some((s) => {
        const sStart = new Date(s.scheduled_at).getTime();
        const sEnd = sStart + (s.duration_minutes || 0) * 60000;
        return sStart < endAt.getTime() && sEnd > startAt.getTime();
    });
    if (overlap)
        return fail(409, 'Session overlaps an existing session');
    // Calendar block overlap
    const { data: blocks } = await supabase
        .from('calendar_blocks')
        .select('id, start_at, end_at')
        .eq('therapist_id', therapistId);
    const hasBlock = (blocks || []).some((b) => {
        const bStart = new Date(b.start_at).getTime();
        const bEnd = new Date(b.end_at).getTime();
        return bStart < endAt.getTime() && bEnd > startAt.getTime();
    });
    if (hasBlock)
        return fail(409, 'Conflicts with therapist blocked time');
    const { data: created, error: createError } = await supabase
        .from('appointments')
        .insert({
        seeker_id: recipientId,
        therapist_id: therapistId,
        scheduled_at: startAt.toISOString(),
        duration_minutes: Math.round(durationMinutes),
        status: 'scheduled',
        session_type: sessionType,
        location_type: locationType,
        location_label: locationLabel,
        telehealth_url: telehealthUrl,
        session_data_json: {
            inviteStatus: 'pending',
            inviteNote: note,
        },
    })
        .select('*')
        .single();
    if (createError || !created) {
        console.error('[api/chat/session-invites] create error', createError);
        return fail(500, 'Failed to create session');
    }
    let session = created;
    if (locationType === 'telehealth') {
        const channelName = agoraService.channelNameForSession(session.id);
        const existingData = session.session_data_json || {};
        const { data: updated } = await supabase
            .from('appointments')
            .update({
            session_data_json: {
                ...existingData,
                video_channel: {
                    channel_name: channelName,
                    created_at: new Date().toISOString(),
                },
            },
        })
            .eq('id', session.id)
            .select('*')
            .single();
        if (updated)
            session = updated;
    }
    // Email the seeker about the session invite (best-effort)
    try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Psychlink.pro';
        const admin = createServiceRoleClient();
        const [{ data: seekerAuthData }, { data: therapistProfile }, { data: seekerProfile }] = await Promise.all([
            admin.auth.admin.getUserById(recipientId),
            supabase.from('user_profiles').select('full_name').eq('user_id', therapistId).maybeSingle(),
            supabase.from('user_profiles').select('full_name').eq('user_id', recipientId).maybeSingle(),
        ]);
        const seekerEmail = seekerAuthData?.user?.email;
        if (seekerEmail && seekerProfile) {
            const sessionDate = new Date(startAt);
            const formattedDate = sessionDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const formattedTime = sessionDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            const emailHtml = await render(MessageNotificationEmail({
                recipientName: seekerProfile.full_name,
                senderName: therapistProfile?.full_name || 'Your therapist',
                messagePreview: `Session invite for ${formattedDate} at ${formattedTime} (${durationMinutes} min)`,
                chatUrl: `${appUrl}/chat?with=${therapistId}`,
                settingsUrl: `${appUrl}/seeker/profile`,
                appName,
            }));
            await emailService.sendEmail({
                to: seekerEmail,
                subject: `Session invite from ${therapistProfile?.full_name || 'your therapist'}`,
                html: emailHtml,
            });
        }
    }
    catch (emailErr) {
        console.error('[api/chat/session-invites] email error', emailErr);
    }
    return { ok: true, status: 201, data: { session } };
}
/**
 * Respond to a session invite as the invited seeker. Accept keeps the current
 * status; decline cancels the appointment. Records the response in session_data_json.
 */
export async function respondToSessionInvite(seekerId, sessionId, body) {
    const supabase = await createClient();
    const response = body?.response === 'declined' ? 'declined' : 'accepted';
    const { data: session } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();
    if (!session)
        return fail(404, 'Session not found');
    if (session.seeker_id !== seekerId)
        return fail(403, 'Forbidden');
    const nextSessionData = {
        ...(session.session_data_json || {}),
        inviteStatus: response,
        inviteRespondedAt: new Date().toISOString(),
    };
    const { data: updated, error } = await supabase
        .from('appointments')
        .update({
        status: response === 'declined' ? 'cancelled' : session.status,
        session_data_json: nextSessionData,
    })
        .eq('id', sessionId)
        .select('*')
        .single();
    if (error || !updated)
        return fail(500, 'Failed to update invite');
    return ok({ session: updated });
}
