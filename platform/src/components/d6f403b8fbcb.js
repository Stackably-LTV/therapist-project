import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { emailService } from '@/components/b2a0b00fb250';
import { render } from '@react-email/render';
import MessageNotificationEmail from '@/components/c9deb8d8f726';
/**
 * Create a consultation (connection) request between a therapist and a seeker.
 * Enforces who is allowed to initiate, dedupes existing requests, then sends a
 * best-effort notification email to the other party.
 */
export async function createConsultationRequest(actorId, input) {
    const { therapist_id, seeker_id, initiated_by, initial_message } = input;
    const supabase = await createClient();
    if (initiated_by === 'therapist') {
        if (actorId !== therapist_id) {
            return { ok: false, status: 403, error: 'Only therapists can send invitations' };
        }
        const { data: therapistRole } = await supabase
            .from('user_roles')
            .select('id, role')
            .eq('id', therapist_id)
            .maybeSingle();
        if (!therapistRole || therapistRole.role !== 'therapist') {
            return { ok: false, status: 403, error: 'Only therapists can send invitations' };
        }
        const { data: existingAccepted } = await supabase
            .from('connection_requests')
            .select('id')
            .eq('therapist_id', therapist_id)
            .eq('seeker_id', seeker_id)
            .eq('status', 'accepted')
            .maybeSingle();
        if (existingAccepted) {
            return { ok: false, status: 400, error: 'This person is already your client' };
        }
        const { data: existingRequest } = await supabase
            .from('connection_requests')
            .select('id, status')
            .eq('therapist_id', therapist_id)
            .eq('seeker_id', seeker_id)
            .maybeSingle();
        if (existingRequest && existingRequest.status !== 'declined') {
            return {
                ok: false,
                status: 409,
                error: "You've already sent an invitation to this seeker",
            };
        }
    }
    if (initiated_by === 'seeker' && actorId !== seeker_id) {
        return { ok: false, status: 403, error: 'Forbidden' };
    }
    const { data: created, error } = await supabase
        .from('connection_requests')
        .insert({
        therapist_id,
        seeker_id,
        status: 'pending',
        initiated_by,
        initial_message: initial_message ?? null,
    })
        .select('*')
        .single();
    if (error || !created) {
        console.error('[consultations] insert failed', error);
        return { ok: false, status: 500, error: 'Failed to create consultation request' };
    }
    await notifyConsultationCounterparty({
        supabase,
        initiated_by,
        therapist_id,
        seeker_id,
        initial_message,
    });
    return { ok: true, data: created };
}
/**
 * Best-effort email to the other party when a consultation request is created.
 * Failures are swallowed (logged) so the request still succeeds.
 */
async function notifyConsultationCounterparty(args) {
    const { supabase, initiated_by, therapist_id, seeker_id, initial_message } = args;
    try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Psychlink.pro';
        const admin = createServiceRoleClient();
        if (initiated_by === 'seeker') {
            const [{ data: therapistAuthData }, { data: seekerProfile }] = await Promise.all([
                admin.auth.admin.getUserById(therapist_id),
                supabase.from('user_profiles').select('full_name').eq('user_id', seeker_id).maybeSingle(),
            ]);
            const therapistEmail = therapistAuthData?.user?.email;
            const { data: therapistProfile } = await supabase
                .from('user_profiles')
                .select('full_name')
                .eq('user_id', therapist_id)
                .maybeSingle();
            if (therapistEmail && therapistProfile) {
                const emailHtml = await render(MessageNotificationEmail({
                    recipientName: therapistProfile.full_name,
                    senderName: seekerProfile?.full_name || 'A potential client',
                    messagePreview: initial_message || 'They would like to connect with you.',
                    chatUrl: `${appUrl}/chat?with=${seeker_id}`,
                    settingsUrl: `${appUrl}/therapist/profile`,
                    appName,
                }));
                await emailService.sendEmail({
                    to: therapistEmail,
                    subject: `New consultation request from ${seekerProfile?.full_name || 'a client'}`,
                    html: emailHtml,
                });
            }
        }
        else {
            const [{ data: seekerAuthData }, { data: therapistProfile }] = await Promise.all([
                admin.auth.admin.getUserById(seeker_id),
                supabase.from('user_profiles').select('full_name').eq('user_id', therapist_id).maybeSingle(),
            ]);
            const seekerEmail = seekerAuthData?.user?.email;
            const { data: seekerProfile } = await supabase
                .from('user_profiles')
                .select('full_name')
                .eq('user_id', seeker_id)
                .maybeSingle();
            if (seekerEmail) {
                const emailHtml = await render(MessageNotificationEmail({
                    recipientName: seekerProfile?.full_name || 'there',
                    senderName: therapistProfile?.full_name || 'A therapist',
                    messagePreview: initial_message || 'They would like to invite you as a client.',
                    chatUrl: `${appUrl}/chat?with=${therapist_id}`,
                    settingsUrl: `${appUrl}/seeker/profile`,
                    appName,
                }));
                await emailService.sendEmail({
                    to: seekerEmail,
                    subject: `${therapistProfile?.full_name || 'A therapist'} wants to connect with you`,
                    html: emailHtml,
                });
            }
        }
    }
    catch (emailErr) {
        console.error('[consultations] email error', emailErr);
    }
}
/**
 * Accept or decline a pending consultation request. The therapist responds to
 * seeker-initiated requests; the seeker responds to therapist-initiated ones.
 */
export async function respondToConsultationRequest(actorId, requestId, status) {
    const supabase = await createClient();
    const { data: connectionRequest, error: fetchError } = await supabase
        .from('connection_requests')
        .select('id, status, seeker_id, therapist_id, initiated_by')
        .eq('id', requestId)
        .maybeSingle();
    if (fetchError || !connectionRequest) {
        return { ok: false, status: 404, error: 'Consultation request not found' };
    }
    if (connectionRequest.initiated_by === 'therapist') {
        if (actorId !== connectionRequest.seeker_id) {
            return {
                ok: false,
                status: 403,
                error: 'Only the invited seeker can respond to this invitation',
            };
        }
    }
    else {
        const { data: roleRow } = await supabase
            .from('user_roles')
            .select('role')
            .eq('id', actorId)
            .maybeSingle();
        if (roleRow?.role !== 'therapist' || actorId !== connectionRequest.therapist_id) {
            return {
                ok: false,
                status: 403,
                error: 'Only the therapist can respond to seeker-initiated requests',
            };
        }
    }
    const { data: updated, error } = await supabase
        .from('connection_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .eq('status', 'pending')
        .select('id, status, seeker_id, therapist_id, initiated_by')
        .maybeSingle();
    if (error) {
        return { ok: false, status: 400, error: error.message };
    }
    if (!updated) {
        return {
            ok: false,
            status: 409,
            error: 'Request has already been responded to or no longer exists',
        };
    }
    return { ok: true, data: updated };
}
/** Delete a consultation request. Only the seeker or therapist on it may delete. */
export async function deleteConsultationRequest(actorId, requestId) {
    const supabase = await createClient();
    const { data: existing } = await supabase
        .from('connection_requests')
        .select('seeker_id, therapist_id')
        .eq('id', requestId)
        .maybeSingle();
    if (!existing) {
        return { ok: false, status: 404, error: 'Not found' };
    }
    if (actorId !== existing.seeker_id && actorId !== existing.therapist_id) {
        return { ok: false, status: 403, error: 'Forbidden' };
    }
    const { error } = await supabase.from('connection_requests').delete().eq('id', requestId);
    if (error) {
        return { ok: false, status: 400, error: error.message };
    }
    return { ok: true, data: null };
}
