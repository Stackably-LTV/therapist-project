import 'server-only';
import { createServiceRoleClient } from '@/components/9a6b39502e62';
import { notificationService } from '@/components/4fe8d6eb004f';
import { ok, fail } from '@/components/7ff049787825';
function asOptionalString(value) {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
const APP_URL_FALLBACK = () => process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
// ---------------------------------------------------------------------------
// DELETE /api/therapist/patients/invites/[inviteId]
// ---------------------------------------------------------------------------
export async function deletePatientInvite(therapistId, inviteId) {
    const id = typeof inviteId === 'string' ? inviteId.trim() : '';
    if (!id)
        return fail(400, 'inviteId is required');
    const serviceRole = createServiceRoleClient();
    const { data: invite, error: inviteError } = await serviceRole
        .from('connection_requests')
        .select('id, status, therapist_id')
        .eq('id', id)
        .eq('therapist_id', therapistId)
        .maybeSingle();
    if (inviteError || !invite) {
        return fail(404, 'Pending invite not found');
    }
    if (invite.status !== 'pending') {
        return fail(400, 'Only pending invites can be deleted');
    }
    const { error: deleteError } = await serviceRole
        .from('connection_requests')
        .delete()
        .eq('id', invite.id)
        .eq('therapist_id', therapistId);
    if (deleteError) {
        return fail(500, deleteError.message || 'Failed to delete invite');
    }
    return ok({ success: true });
}
// ---------------------------------------------------------------------------
// POST /api/therapist/patients/invites/resend
// ---------------------------------------------------------------------------
export async function resendPatientInvite(therapistId, body) {
    const inviteId = asOptionalString(body?.inviteId);
    if (!inviteId) {
        return fail(400, 'inviteId is required');
    }
    const serviceRole = createServiceRoleClient();
    const { data: invite, error: inviteError } = await serviceRole
        .from('connection_requests')
        .select('id, status, therapist_id, seeker_email, seeker_name, metadata_json')
        .eq('id', inviteId)
        .eq('therapist_id', therapistId)
        .maybeSingle();
    if (inviteError || !invite) {
        return fail(404, 'Pending invite not found');
    }
    if (invite.status !== 'pending') {
        return fail(400, 'Only pending invites can be resent');
    }
    const seekerEmail = asOptionalString(invite.seeker_email);
    if (!seekerEmail) {
        return fail(400, 'Invite email is missing');
    }
    const { data: therapistProfile } = await serviceRole
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', therapistId)
        .maybeSingle();
    const therapistName = therapistProfile?.full_name || 'Your therapist';
    const appUrl = APP_URL_FALLBACK();
    const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const metadata = (invite.metadata_json || {});
    const requiresSignup = Boolean(metadata.inviteRequiresSignup);
    let signupUrl = `${appUrl}/login?mode=signup&?email=${encodeURIComponent(seekerEmail)}`;
    if (requiresSignup) {
        try {
            const { data: recoveryLinkData } = await serviceRole.auth.admin.generateLink({
                type: 'recovery',
                email: seekerEmail,
                options: {
                    redirectTo: `${appUrl}/api/auth/callback?next=/login`,
                },
            });
            if (recoveryLinkData?.properties?.action_link) {
                signupUrl = recoveryLinkData.properties.action_link;
            }
        }
        catch (linkError) {
            console.warn('[api/therapist/patients/invites/resend] Failed to generate account setup link', linkError);
        }
    }
    const { error: updateError } = await serviceRole
        .from('connection_requests')
        .update({
        invite_token: token,
        expires_at: expiresAt,
    })
        .eq('id', invite.id);
    if (updateError) {
        return fail(500, updateError.message || 'Failed to refresh invite token');
    }
    const emailResult = await notificationService.sendClientInvite({
        to: seekerEmail,
        seekerName: asOptionalString(invite.seeker_name),
        therapistName,
        acceptUrl: `${appUrl}/api/therapist/patients/invites/accept?token=${encodeURIComponent(token)}`,
        rejectUrl: `${appUrl}/api/therapist/patients/invites/reject?token=${encodeURIComponent(token)}`,
        requiresSignup,
        signupUrl,
    });
    if (!emailResult.success) {
        return fail(500, `Email send failed: ${emailResult.error}`);
    }
    return ok({
        success: true,
        emailId: emailResult.messageId ?? null,
        recipient: seekerEmail,
    });
}
// ---------------------------------------------------------------------------
// GET /api/therapist/patients/invites/accept  → returns a redirect URL
// ---------------------------------------------------------------------------
export async function acceptPatientInvite(token) {
    const appUrl = APP_URL_FALLBACK();
    const t = token?.trim() || '';
    if (!t) {
        return { redirectTo: `${appUrl}/login?error=invalid_invite` };
    }
    const serviceRole = createServiceRoleClient();
    const { data: invite, error } = await serviceRole
        .from('connection_requests')
        .select('*')
        .eq('invite_token', t)
        .maybeSingle();
    if (error || !invite) {
        return { redirectTo: `${appUrl}/login?error=invite_not_found` };
    }
    if (invite.status !== 'pending') {
        return { redirectTo: `${appUrl}/login?error=invite_already_processed` };
    }
    const expiresAt = invite.expires_at ? new Date(invite.expires_at).getTime() : 0;
    if (!expiresAt || expiresAt < Date.now()) {
        await serviceRole
            .from('connection_requests')
            .update({ status: 'declined' })
            .eq('id', invite.id);
        return { redirectTo: `${appUrl}/login?error=invite_expired` };
    }
    const therapistId = String(invite.therapist_id || '');
    const seekerEmail = String(invite.seeker_email || '');
    const metadata = (invite.metadata_json || {});
    if (!therapistId || !seekerEmail) {
        return { redirectTo: `${appUrl}/login?error=invalid_invite_data` };
    }
    // Look up seeker by email — they may already exist on platform.
    let seekerUserId = null;
    try {
        const { data: list } = await serviceRole.auth.admin.listUsers({ page: 1, perPage: 200 });
        const match = list?.users?.find((u) => (u.email || '').toLowerCase() === seekerEmail.toLowerCase());
        if (match)
            seekerUserId = match.id;
    }
    catch {
        /* ignore */
    }
    // If seeker exists on platform, link the relationship now.
    if (seekerUserId) {
        const { data: existing } = await serviceRole
            .from('patient_records')
            .select('seeker_id, primary_therapist_id')
            .eq('seeker_id', seekerUserId)
            .maybeSingle();
        if (existing) {
            await serviceRole
                .from('patient_records')
                .update({ primary_therapist_id: therapistId })
                .eq('seeker_id', seekerUserId);
        }
        else {
            await serviceRole.from('patient_records').insert({
                seeker_id: seekerUserId,
                primary_therapist_id: therapistId,
                contact_email: seekerEmail,
            });
        }
        // Insert therapist's optional internal note (therapist-owned, private).
        const internalNote = asOptionalString(metadata.internalNote);
        if (internalNote) {
            await serviceRole.from('clinical_provider_notes').insert({
                therapist_id: therapistId,
                seeker_id: seekerUserId,
                title: 'Internal note',
                content: internalNote,
                note_type: 'general',
                is_private: true,
            });
        }
    }
    // Mark invite accepted. Switch from email-path to seeker-id path if user exists,
    // satisfying the path_check constraint atomically.
    await serviceRole
        .from('connection_requests')
        .update({
        status: 'accepted',
        ...(seekerUserId
            ? { seeker_id: seekerUserId, seeker_email: null, invite_token: null }
            : { invite_token: null }),
    })
        .eq('id', invite.id);
    if (!seekerUserId) {
        return {
            redirectTo: `${appUrl}/login?mode=signup&?invited=1&email=${encodeURIComponent(seekerEmail)}`,
        };
    }
    return { redirectTo: `${appUrl}/login?invite=accepted` };
}
// ---------------------------------------------------------------------------
// GET /api/therapist/patients/invites/reject  → returns a redirect URL
// ---------------------------------------------------------------------------
export async function rejectPatientInvite(token) {
    const appUrl = APP_URL_FALLBACK();
    const t = token?.trim() || '';
    if (!t) {
        return { redirectTo: `${appUrl}/login?error=invalid_invite` };
    }
    const serviceRole = createServiceRoleClient();
    const { data: invite } = await serviceRole
        .from('connection_requests')
        .select('id,status')
        .eq('invite_token', t)
        .maybeSingle();
    if (!invite) {
        return { redirectTo: `${appUrl}/login?error=invite_not_found` };
    }
    if (invite.status === 'pending') {
        await serviceRole
            .from('connection_requests')
            .update({ status: 'declined', updated_at: new Date().toISOString() })
            .eq('id', invite.id);
    }
    return { redirectTo: `${appUrl}/login?invite=declined` };
}
