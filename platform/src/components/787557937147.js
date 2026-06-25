import 'server-only';
import { createClient } from '@/components/9a6b39502e62';
import { agoraService } from '@/components/ad1214aa1aae';
import { ok, fail } from '@/components/7ff049787825';
const PREJOIN_MINUTES = Number(process.env.VIDEO_PREJOIN_MINUTES ?? 30);
/**
 * Issue an Agora RTC token for a session participant. Enforces participation,
 * session status (cancelled / pending_payment), and the pre-join time window,
 * and flips a scheduled session to in_progress on first valid join.
 */
export async function issueSessionToken(args) {
    const { userId, sessionId } = args;
    const supabase = await createClient();
    const { data: session } = await supabase
        .from('appointments')
        .select('id, therapist_id, seeker_id, status, scheduled_at, duration_minutes, session_data_json')
        .eq('id', sessionId)
        .maybeSingle();
    if (!session) {
        return fail(404, 'Session not found');
    }
    const isTherapist = userId === session.therapist_id;
    const isClient = userId === session.seeker_id;
    if (!isTherapist && !isClient) {
        return fail(403, 'Not a participant');
    }
    if (session.status === 'cancelled') {
        return fail(400, 'Session is cancelled');
    }
    if (session.status === 'pending_payment') {
        return fail(402, 'Payment is required before joining this session');
    }
    const sessionData = session.session_data_json || {};
    const isQuickSession = sessionData.origin === 'dm_video_call';
    if (!isQuickSession && session.scheduled_at) {
        const scheduledTime = new Date(session.scheduled_at).getTime();
        const now = Date.now();
        const prejoinWindow = scheduledTime - PREJOIN_MINUTES * 60 * 1000;
        if (now < prejoinWindow) {
            const minutesUntilPrejoin = Math.ceil((prejoinWindow - now) / 60000);
            return fail(400, `Session opens in ${minutesUntilPrejoin} minutes`);
        }
    }
    const channelName = agoraService.channelNameForSession(sessionId);
    const uid = agoraService.userIdToUid(userId);
    const durationSeconds = (session.duration_minutes || 60) * 60 + 30 * 60;
    const result = agoraService.generateToken({
        channelName,
        uid,
        expirationSeconds: durationSeconds,
    });
    if (session.status === 'scheduled') {
        await supabase.from('appointments').update({ status: 'in_progress' }).eq('id', sessionId);
    }
    return ok({
        ...result,
        participantRole: isTherapist ? 'therapist' : 'seeker',
        session: {
            id: session.id,
            seekerId: session.seeker_id,
            scheduledAt: session.scheduled_at,
            durationMinutes: session.duration_minutes,
            status: session.status === 'scheduled' ? 'in_progress' : session.status,
        },
    });
}
/**
 * Resolve a signed download URL for a session's recording. Only the session's
 * therapist or seeker may access it. Returns the signed URL for the handler to
 * redirect to.
 */
export async function getSessionRecordingUrl(args) {
    const { userId, sessionId } = args;
    const supabase = await createClient();
    const { data: session, error: sessionError } = await supabase
        .from('appointments')
        .select('id, seeker_id, therapist_id')
        .eq('id', sessionId)
        .maybeSingle();
    if (sessionError)
        throw sessionError;
    if (!session) {
        return fail(404, 'Session not found');
    }
    if (session.seeker_id !== userId && session.therapist_id !== userId) {
        return fail(403, 'You do not have access to this recording');
    }
    const { data: document, error: documentError } = await supabase
        .from('file_uploads')
        .select('file_url')
        .eq('related_id', sessionId)
        .eq('type', 'recording')
        .maybeSingle();
    if (documentError)
        throw documentError;
    if (!document) {
        return fail(404, 'Recording not found');
    }
    const parts = document.file_url.split('/');
    if (parts.length < 2) {
        return fail(500, 'Invalid file URL');
    }
    const bucket = parts[0];
    const path = parts.slice(1).join('/');
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600);
    if (signedUrlError || !signedUrlData) {
        console.error('Signed URL error:', signedUrlError);
        return fail(500, 'Failed to generate download URL');
    }
    return ok({ signedUrl: signedUrlData.signedUrl });
}
