import 'server-only';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { emailService } from '@/components/b2a0b00fb250';
import { logAuditEvent } from '@/components/0be57ea0c568';
import { render } from '@react-email/render';
import TherapistApprovedEmail from '@/components/051e83d4b7c7';
import { ok, fail } from '@/components/7ff049787825';
/**
 * Approve a pending therapist: flips the user_roles row to active, logs an audit
 * event, and sends a best-effort approval email. Idempotent when already active.
 */
export async function approveTherapist(adminUserId, therapistId, meta) {
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Psychlink.pro';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const supabase = await createClient();
    // Get therapist role row
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
    // Idempotency: if already approved, return early
    if (therapistRole.status === 'active') {
        return ok({ alreadyApproved: true });
    }
    // Update status to active
    const { error: updateError } = await supabase
        .from('user_roles')
        .update({ status: 'active' })
        .eq('id', therapistId);
    if (updateError) {
        console.error('Error approving therapist:', updateError);
        return fail(500, 'Failed to approve therapist');
    }
    // Log audit event
    await logAuditEvent({
        userId: adminUserId,
        action: 'therapist.approve',
        tableName: 'user_roles',
        recordId: therapistId,
        newData: { status: 'active' },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
    });
    // Fetch profile + auth email for email content
    try {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('user_id', therapistId)
            .maybeSingle();
        const serviceClient = createServiceRoleClient();
        const { data: authResult } = await serviceClient.auth.admin.getUserById(therapistId);
        const therapistEmail = authResult?.user?.email;
        const therapistName = profile?.full_name || 'Therapist';
        if (therapistEmail) {
            const emailHtml = await render(TherapistApprovedEmail({
                therapistName,
                dashboardUrl: `${appUrl}/therapist`,
                appName,
            }));
            await emailService.sendEmail({
                to: therapistEmail,
                subject: `Your ${appName} application has been approved`,
                html: emailHtml,
            });
        }
    }
    catch (emailError) {
        console.error('Failed to send approval email:', emailError);
        // Don't fail the request if email fails
    }
    return ok({});
}
