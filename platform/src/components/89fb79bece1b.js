import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { agoraService } from '@/components/ad1214aa1aae';
import { capturePaymentForSession } from '@/components/3c316002396d';
import { serializeRichMessage } from '@/components/a6e7ef5e01c9';
import { ok, fail } from '@/components/7ff049787825';
function asOptionalString(v) {
    if (typeof v !== 'string')
        return null;
    const s = v.trim();
    return s.length ? s : null;
}
async function canAccessSeeker(therapistId, seekerId, supabase) {
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
    // Free chat enables real-time-action features: a therapist can start a quick
    // call with anyone they've messaged or invited (excluding declined invites).
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
        .select('id')
        .eq('therapist_id', therapistId)
        .eq('seeker_id', seekerId)
        .neq('status', 'declined')
        .limit(1)
        .maybeSingle();
    return !!req;
}
async function ensureQuickSessionAnnouncement(params) {
    try {
        const serviceRole = createServiceRoleClient();
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: recent } = await serviceRole
            .from('messages')
            .select('id, content, created_at')
            .eq('sender_id', params.therapistId)
            .eq('recipient_id', params.recipientId)
            .gte('created_at', fiveMinutesAgo)
            .order('created_at', { ascending: false })
            .limit(10);
        const alreadyAnnounced = (recent || []).some((m) => {
            const content = typeof m.content === 'string' ? m.content : '';
            return content.includes('"type":"video_call"') && content.includes(params.sessionId);
        });
        if (alreadyAnnounced)
            return;
        const content = serializeRichMessage({
            type: 'video_call',
            version: 1,
            sessionId: params.sessionId,
            title: 'Therapist started a quick session',
            startedAt: params.startedAtIso,
        });
        await serviceRole.from('messages').insert({
            sender_id: params.therapistId,
            recipient_id: params.recipientId,
            content,
            read_at: null,
        });
    }
    catch (err) {
        console.warn('[api/chat/video-call/start] failed to announce quick session', err);
    }
}
/**
 * Find the active DM-originated quick session between the user and a partner,
 * in either direction. Returns `{ session: null }` if none is in progress.
 */
export async function getActiveVideoCall(userId, recipientId) {
    const supabase = await createClient();
    const { data: sessions } = await supabase
        .from('appointments')
        .select('*')
        .or(`and(therapist_id.eq.${userId},seeker_id.eq.${recipientId}),and(seeker_id.eq.${userId},therapist_id.eq.${recipientId})`)
        .eq('session_type', 'quick_session')
        .eq('location_type', 'telehealth')
        .in('status', ['in_progress', 'scheduled']);
    const active = (sessions || []).find((s) => {
        const meta = s.session_data_json || {};
        return typeof meta.origin === 'string' && meta.origin === 'dm_video_call';
    });
    if (!active)
        return ok({ session: null });
    return ok({ session: active });
}
/**
 * Start (or reuse/heal) a DM quick session between the therapist and a recipient.
 * Provisions an Agora channel and announces the session in chat. Returns the
 * session with a `reused` flag (201 when freshly created).
 */
export async function startVideoCall(therapistId, body) {
    const supabase = await createClient();
    const recipientId = asOptionalString(body?.recipientId);
    const durationRaw = Number(body?.durationMinutes ?? 60);
    const durationMinutes = Number.isFinite(durationRaw) && durationRaw > 0 ? Math.round(durationRaw) : 60;
    if (!recipientId) {
        return fail(400, 'recipientId is required');
    }
    const allowed = await canAccessSeeker(therapistId, recipientId, supabase);
    if (!allowed)
        return fail(403, 'Forbidden');
    // Find any active quick session
    const { data: candidates } = await supabase
        .from('appointments')
        .select('*')
        .eq('therapist_id', therapistId)
        .eq('seeker_id', recipientId)
        .eq('session_type', 'quick_session')
        .eq('location_type', 'telehealth')
        .in('status', ['in_progress', 'scheduled'])
        .order('scheduled_at', { ascending: false })
        .limit(10);
    let existingActive = (candidates || []).find((s) => {
        const meta = s.session_data_json || {};
        return typeof meta.origin === 'string' && meta.origin === 'dm_video_call';
    });
    if (existingActive) {
        const existingData = existingActive.session_data_json || {};
        const existingChannel = existingData.video_channel;
        if (!existingChannel?.channel_name) {
            const channelName = agoraService.channelNameForSession(existingActive.id);
            const { data: healed } = await supabase
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
                .eq('id', existingActive.id)
                .select('*')
                .single();
            if (healed)
                existingActive = healed;
        }
        await ensureQuickSessionAnnouncement({
            therapistId,
            recipientId,
            sessionId: existingActive.id,
            startedAtIso: new Date().toISOString(),
        });
        return ok({ session: existingActive, reused: true });
    }
    const { data: created, error: createError } = await supabase
        .from('appointments')
        .insert({
        seeker_id: recipientId,
        therapist_id: therapistId,
        scheduled_at: new Date().toISOString(),
        duration_minutes: durationMinutes,
        status: 'in_progress',
        session_type: 'quick_session',
        location_type: 'telehealth',
        session_data_json: {
            origin: 'dm_video_call',
            quick_session: true,
            chat_partner_id: recipientId,
        },
    })
        .select('*')
        .single();
    if (createError || !created) {
        console.error('[api/chat/video-call/start] create error', createError);
        return fail(500, 'Failed to start session');
    }
    let session = created;
    const channelName = agoraService.channelNameForSession(session.id);
    const { data: updated } = await supabase
        .from('appointments')
        .update({
        session_data_json: {
            ...(session.session_data_json || {}),
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
    await ensureQuickSessionAnnouncement({
        therapistId,
        recipientId,
        sessionId: session.id,
        startedAtIso: new Date().toISOString(),
    });
    return { ok: true, status: 201, data: { session, reused: false } };
}
/**
 * End a DM quick session as the owning therapist. Only quick sessions can be
 * ended from chat. Marks the appointment completed and captures payment
 * (best-effort). Returns the updated session and capture result.
 */
export async function endVideoCall(therapistId, body) {
    const supabase = await createClient();
    const sessionId = asOptionalString(body?.sessionId);
    const recipientId = asOptionalString(body?.recipientId);
    if (!sessionId)
        return fail(400, 'sessionId is required');
    const { data: session } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();
    if (!session)
        return fail(404, 'Session not found');
    if (session.therapist_id !== therapistId)
        return fail(403, 'Forbidden');
    const meta = session.session_data_json || {};
    const origin = typeof meta.origin === 'string' ? meta.origin : '';
    const isQuickSession = session.session_type === 'quick_session' ||
        origin === 'dm_video_call' ||
        meta.quick_session === true;
    if (!isQuickSession) {
        return fail(400, 'Only quick sessions can be ended from chat.');
    }
    if (recipientId && session.seeker_id !== recipientId) {
        return fail(400, 'recipientId does not match session client.');
    }
    const nextMeta = {
        ...meta,
        quick_session_ended_at: new Date().toISOString(),
        quick_session_ended_by: 'therapist',
    };
    const { data: updated } = await supabase
        .from('appointments')
        .update({
        status: 'completed',
        session_data_json: nextMeta,
    })
        .eq('id', sessionId)
        .select('*')
        .single();
    // Capture the auth-hold now that the session is over. Best-effort: surface
    // failures in logs but do not block the end-of-session response.
    const captureResult = await capturePaymentForSession(sessionId);
    if (captureResult.ok === false) {
        console.error('[video-call/end] payment capture failed', captureResult.error);
    }
    return ok({
        ok: true,
        session: updated ?? session,
        capture: captureResult,
    });
}
