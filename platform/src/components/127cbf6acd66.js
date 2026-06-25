import { createServiceRoleClient } from '@/components/9a6b39502e62';
import { emailService } from '@/components/b2a0b00fb250';
import { agoraService } from '@/components/ad1214aa1aae';
/**
 * Finalize a session booking: ensure status is 'scheduled', stamp the video
 * channel name into session_data_json, and send confirmation emails.
 *
 * Runs from server-owned workflows such as Stripe webhooks, so reads/writes use
 * the service-role client rather than a request-bound user session.
 */
export async function finalizeSessionBooking(sessionId) {
    const supabase = createServiceRoleClient();
    // Pull the appointment with both party profiles for the email payload.
    const { data: session, error: fetchError } = await supabase
        .from('appointments')
        .select(`
      *,
      therapist_profile:user_profiles!appointments_therapist_id_fkey(full_name),
      seeker_profile:user_profiles!appointments_seeker_id_fkey(full_name)
    `)
        .eq('id', sessionId)
        .maybeSingle();
    if (fetchError)
        throw fetchError;
    if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
    }
    // Ensure status is 'scheduled'
    if (session.status !== 'scheduled') {
        const { error } = await supabase
            .from('appointments')
            .update({ status: 'scheduled' })
            .eq('id', session.id);
        if (error)
            throw error;
        session.status = 'scheduled';
    }
    // Ensure a video channel exists in session_data_json
    const existingData = session.session_data_json || {};
    const existingChannel = existingData.video_channel;
    if (!existingChannel?.channel_name) {
        const channelName = agoraService.channelNameForSession(session.id);
        const newSessionData = {
            ...existingData,
            video_channel: {
                channel_name: channelName,
                created_at: new Date().toISOString(),
            },
        };
        const { error } = await supabase
            .from('appointments')
            .update({ session_data_json: newSessionData })
            .eq('id', session.id);
        if (error)
            throw error;
        session.session_data_json = newSessionData;
    }
    // Resolve emails for both parties from auth.users via service role.
    const adminClient = supabase;
    const [{ data: therapistAuth }, { data: seekerAuth }] = await Promise.all([
        adminClient.auth.admin.getUserById(session.therapist_id),
        adminClient.auth.admin.getUserById(session.seeker_id),
    ]);
    const therapistEmail = therapistAuth?.user?.email ?? '';
    const seekerEmail = seekerAuth?.user?.email ?? '';
    const therapistName = session.therapist_profile?.full_name ?? 'Therapist';
    const seekerName = session.seeker_profile?.full_name ?? 'Client';
    if (!therapistEmail || !seekerEmail) {
        return session;
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    try {
        await emailService.sendBookingConfirmation({
            clientEmail: seekerEmail,
            clientName: seekerName,
            therapistName,
            sessionDate: new Date(session.scheduled_at),
            sessionDuration: session.duration_minutes,
            sessionId: session.id,
            joinLink: `${appUrl}/seeker/sessions/${session.id}`,
        });
        await emailService.sendTherapistBookingNotification({
            clientEmail: therapistEmail,
            clientName: seekerName,
            therapistName,
            therapistEmail,
            sessionDate: new Date(session.scheduled_at),
            sessionDuration: session.duration_minutes,
            sessionId: session.id,
            joinLink: `${appUrl}/therapist/sessions/${session.id}`,
        });
    }
    catch (error) {
        console.error('[finalizeSessionBooking] email error', error);
    }
    return session;
}
