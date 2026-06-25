import 'server-only';
import { createServiceRoleClient } from '@/components/9a6b39502e62';
import { notificationService } from '@/components/4fe8d6eb004f';
import { ok, fail } from '@/components/7ff049787825';
function asOptionalString(value) {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
}
function splitName(name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length)
        return { first: null, last: null };
    if (parts.length === 1)
        return { first: parts[0], last: null };
    return { first: parts[0], last: parts.slice(1).join(' ') };
}
function normalizeEmail(value) {
    if (typeof value !== 'string')
        return null;
    const email = value.trim().toLowerCase();
    if (!email)
        return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return null;
    return email;
}
function makeDefaultNameFromEmail(email) {
    const local = email.split('@')[0] || 'Client';
    const cleaned = local.replace(/[._-]+/g, ' ').trim();
    return cleaned ? cleaned.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Client';
}
async function ensureAssignableClientProfile(supabase, params) {
    const { data: existingProfile } = await supabase
        .from('patient_records')
        .select('seeker_id, primary_therapist_id')
        .eq('seeker_id', params.seekerId)
        .maybeSingle();
    if (existingProfile) {
        if (existingProfile.primary_therapist_id === params.therapistId) {
            return;
        }
        if (existingProfile.primary_therapist_id) {
            // check if therapist has had at least one appointment with this seeker
            const { count } = await supabase
                .from('appointments')
                .select('id', { count: 'exact', head: true })
                .eq('therapist_id', params.therapistId)
                .eq('seeker_id', params.seekerId);
            if (!count) {
                throw new Error('This seeker is already assigned to another therapist.');
            }
        }
        const { error } = await supabase
            .from('patient_records')
            .update({
            primary_therapist_id: params.therapistId,
            contact_email: params.email,
        })
            .eq('seeker_id', params.seekerId);
        if (error)
            throw error;
        return;
    }
    const nameParts = splitName(params.name || '');
    const { error: insertError } = await supabase.from('patient_records').insert({
        seeker_id: params.seekerId,
        primary_therapist_id: params.therapistId,
        legal_first_name: nameParts.first,
        legal_last_name: nameParts.last,
        contact_email: params.email,
        administrative_sex: 'unknown',
        mobile_phone_messages: 'none',
        home_phone_messages: 'none',
        work_phone_messages: 'none',
        other_phone_messages: 'none',
        smoking_status: 'unknown',
        marital_status: 'unknown',
        employment_status: 'unknown',
        has_pcp: false,
        pcp_release_signed: false,
        hipaa_release_signed: false,
    });
    if (insertError)
        throw insertError;
}
/** Link an existing seeker as a client, or invite a new one by email. */
export async function linkPatient(therapistId, body) {
    const serviceRole = createServiceRoleClient();
    const userId = asOptionalString(body?.userId);
    const inviteEmail = normalizeEmail(body?.email);
    const inviteName = asOptionalString(body?.name);
    if (!userId && !inviteEmail) {
        return fail(400, 'userId or email is required');
    }
    // Path A: link an existing seeker user by id
    if (userId) {
        const { data: roleRow } = await serviceRole
            .from('user_roles')
            .select('id, role')
            .eq('id', userId)
            .maybeSingle();
        if (!roleRow)
            return fail(404, 'User not found');
        if (roleRow.role !== 'seeker') {
            return fail(400, 'Only seeker accounts can be linked as clients');
        }
        const { data: profileRow } = await serviceRole
            .from('user_profiles')
            .select('full_name')
            .eq('user_id', userId)
            .maybeSingle();
        // Look up email from auth for contact info
        const { data: authUser } = await serviceRole.auth.admin.getUserById(userId);
        const seekerEmail = authUser?.user?.email ?? null;
        const seekerName = profileRow?.full_name ?? null;
        try {
            await ensureAssignableClientProfile(serviceRole, {
                seekerId: roleRow.id,
                therapistId,
                name: seekerName,
                email: seekerEmail,
            });
        }
        catch (profileError) {
            const message = profileError instanceof Error ? profileError.message : 'Failed to link client';
            return fail(409, message);
        }
        return ok({
            client: { id: roleRow.id, name: seekerName, email: seekerEmail, isClient: true },
            created: true,
        });
    }
    // Path B: invite by email
    const email = inviteEmail;
    const displayName = inviteName || makeDefaultNameFromEmail(email);
    // Look up existing auth user by email
    let authUserId = null;
    let existedOnPlatform = false;
    {
        const { data: list } = await serviceRole.auth.admin.listUsers({ page: 1, perPage: 200 });
        const match = list?.users?.find((u) => (u.email || '').toLowerCase() === email);
        if (match) {
            authUserId = match.id;
            existedOnPlatform = true;
        }
    }
    if (authUserId) {
        const { data: existingRole } = await serviceRole
            .from('user_roles')
            .select('id, role')
            .eq('id', authUserId)
            .maybeSingle();
        if (existingRole && existingRole.role !== 'seeker') {
            return fail(409, 'This email is already used by a non-seeker account. Use a different email.');
        }
    }
    else {
        // Create the auth user
        const temporaryPassword = `Temp-${crypto.randomUUID()}!`;
        const { data: createdAuthUser, error: createAuthError } = await serviceRole.auth.admin.createUser({
            email,
            password: temporaryPassword,
            email_confirm: true,
            user_metadata: {
                name: displayName,
                role: 'seeker',
            },
        });
        if (createAuthError || !createdAuthUser?.user) {
            return fail(500, createAuthError?.message || 'Failed to create seeker account');
        }
        authUserId = createdAuthUser.user.id;
    }
    const therapistName = await (async () => {
        const { data } = await serviceRole
            .from('user_profiles')
            .select('full_name')
            .eq('user_id', therapistId)
            .maybeSingle();
        return data?.full_name || 'Your therapist';
    })();
    const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
    let signupUrl = `${appUrl}/login?mode=signup&?email=${encodeURIComponent(email)}`;
    if (!existedOnPlatform) {
        try {
            const { data: recoveryLinkData } = await serviceRole.auth.admin.generateLink({
                type: 'recovery',
                email,
                options: {
                    redirectTo: `${appUrl}/api/auth/callback?next=/login`,
                },
            });
            if (recoveryLinkData?.properties?.action_link) {
                signupUrl = recoveryLinkData.properties.action_link;
            }
        }
        catch (linkError) {
            console.warn('[api/therapist/patients/link] Failed to generate account setup link; falling back to signup URL', linkError);
        }
    }
    const insertPayload = {
        therapist_id: therapistId,
        seeker_email: email,
        seeker_name: displayName,
        invite_token: token,
        status: 'pending',
        expires_at: expiresAt,
        initiated_by: 'therapist',
        metadata_json: {
            inviteRequiresSignup: !existedOnPlatform,
        },
    };
    const { error: inviteError } = await serviceRole
        .from('connection_requests')
        .insert(insertPayload);
    if (inviteError) {
        return fail(500, inviteError.message || 'Failed to create consent invite');
    }
    const emailResult = await notificationService.sendClientInvite({
        to: email,
        seekerName: displayName,
        therapistName,
        acceptUrl: `${appUrl}/api/therapist/patients/invites/accept?token=${encodeURIComponent(token)}`,
        rejectUrl: `${appUrl}/api/therapist/patients/invites/reject?token=${encodeURIComponent(token)}`,
        requiresSignup: !existedOnPlatform,
        signupUrl,
    });
    if (!emailResult.success) {
        console.warn('[api/therapist/patients/link] Email sending failed', {
            to: email,
            error: emailResult.error,
        });
    }
    return ok({
        client: { id: authUserId, name: displayName, email, isClient: true },
        created: true,
        inviteSent: emailResult.success,
        emailStatus: emailResult.success ? 'sent' : 'failed',
        emailError: emailResult.success ? undefined : emailResult.error,
    });
}
