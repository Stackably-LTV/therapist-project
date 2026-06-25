import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { emailService } from '@/components/b2a0b00fb250';
import { logAuditEvent } from '@/components/0be57ea0c568';
import { render } from '@react-email/render';
import TherapistRejectedEmail from '@/components/d99ea17bc5be';
import { ok, fail } from '@/components/7ff049787825';
/**
 * Reject a therapist application: sends a best-effort rejection email, deletes the
 * user_roles row (auth.users + user_profiles stay so they can reapply), and audits.
 */
export async function rejectTherapist(adminUserId, therapistId, rawReason, meta) {
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Psychlink.pro';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@psychlink.pro';
    // Trim reason, default to null if empty
    const reason = rawReason ? rawReason.trim() || null : null;
    const supabase = await createClient();
    const { data: therapistRole } = await supabase
        .from('user_roles')
        .select('id, role, status')
        .eq('id', therapistId)
        .maybeSingle();
    if (!therapistRole) {
        return fail(404, 'Therapist not found');
    }
    if (therapistRole.role !== 'therapist') {
        return fail(400, 'User is not a therapist');
    }
    // Send rejection email BEFORE deleting the row so we can still resolve their email.
    const serviceClient = createServiceRoleClient();
    try {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('user_id', therapistId)
            .maybeSingle();
        const { data: authResult } = await serviceClient.auth.admin.getUserById(therapistId);
        const therapistEmail = authResult?.user?.email;
        const therapistName = profile?.full_name || 'Therapist';
        if (therapistEmail) {
            const emailHtml = await render(TherapistRejectedEmail({
                therapistName,
                supportEmail,
                appName,
                reapplyUrl: `${appUrl}/login?mode=signup&`,
                reason,
            }));
            await emailService.sendEmail({
                to: therapistEmail,
                subject: `Update on your ${appName} application`,
                html: emailHtml,
            });
        }
    }
    catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
    }
    // Rejection = delete the user_roles row. The auth.users row stays so they can sign back
    // in (the middleware will route them to /login?mode=signup& since they have no role) and reapply.
    // user_profiles is left intact so a reapplication can prefill.
    const { error: deleteError } = await serviceClient
        .from('user_roles')
        .delete()
        .eq('id', therapistId);
    if (deleteError) {
        console.error('Error deleting therapist role:', deleteError);
        return fail(500, 'Failed to reject therapist');
    }
    // Log audit event
    await logAuditEvent({
        userId: adminUserId,
        action: 'therapist.reject',
        tableName: 'user_roles',
        recordId: therapistId,
        oldData: { status: therapistRole.status, role: 'therapist' },
        newData: { deleted: true, rejection_reason: reason },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
    });
    return ok(null);
}
