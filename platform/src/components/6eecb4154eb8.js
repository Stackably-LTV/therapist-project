import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { emailService } from '@/components/b2a0b00fb250';
import { ok, fail } from '@/components/7ff049787825';
/**
 * Send booking confirmation emails to both the seeker and therapist for a
 * session. Either party on the appointment may trigger this. Emails are sent
 * via emailService; any failure surfaces as a 500 to the caller (matching the
 * original route's catch-all behavior).
 */
export async function sendBookingEmails(args) {
    const { userId, sessionId } = args;
    if (!sessionId) {
        return fail(400, 'Missing sessionId');
    }
    const supabase = await createClient();
    const { data: session } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();
    if (!session) {
        return fail(404, 'Session not found');
    }
    if (session.therapist_id !== userId && session.seeker_id !== userId) {
        return fail(403, 'Forbidden');
    }
    // Use service role for cross-user reads of email/name
    const service = createServiceRoleClient();
    const [therapistProfileRes, seekerProfileRes] = await Promise.all([
        service.from('user_profiles').select('full_name').eq('user_id', session.therapist_id).maybeSingle(),
        service.from('user_profiles').select('full_name').eq('user_id', session.seeker_id).maybeSingle(),
    ]);
    const [{ data: therapistAuth }, { data: seekerAuth }] = await Promise.all([
        service.auth.admin.getUserById(session.therapist_id),
        service.auth.admin.getUserById(session.seeker_id),
    ]);
    const therapistEmail = therapistAuth?.user?.email ?? '';
    const seekerEmail = seekerAuth?.user?.email ?? '';
    const therapistName = therapistProfileRes.data?.full_name ?? 'Therapist';
    const seekerName = seekerProfileRes.data?.full_name ?? 'Client';
    const clientJoinLink = `${process.env.NEXT_PUBLIC_APP_URL}/seeker/sessions/${sessionId}`;
    const therapistJoinLink = `${process.env.NEXT_PUBLIC_APP_URL}/therapist/sessions/${sessionId}`;
    await emailService.sendBookingConfirmation({
        clientEmail: seekerEmail,
        clientName: seekerName,
        therapistName,
        sessionDate: new Date(session.scheduled_at),
        sessionDuration: session.duration_minutes ?? 60,
        sessionId,
        joinLink: clientJoinLink,
    });
    await emailService.sendTherapistBookingNotification({
        clientEmail: therapistEmail,
        clientName: seekerName,
        therapistName,
        therapistEmail,
        sessionDate: new Date(session.scheduled_at),
        sessionDuration: session.duration_minutes ?? 60,
        sessionId,
        joinLink: therapistJoinLink,
    });
    return ok({
        success: true,
        message: 'Emails sent successfully',
        clientEmail: seekerEmail,
        therapistEmail,
    });
}
