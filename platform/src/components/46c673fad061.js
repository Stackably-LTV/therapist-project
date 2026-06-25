'use server';
import { createClient, createServiceRoleClient } from '@/components/9a6b39502e62';
import { revalidatePath } from 'next/cache';
import { emailService } from '@/components/b2a0b00fb250';
import { render } from '@react-email/render';
import TherapistDecisionEmail from '@/components/af2a1be568a4';
// `reject` is special: it deletes the user_roles row entirely (the user can reapply via /login?mode=signup&).
// All other actions only flip status.
const ACTION_CONFIG = {
    approve: {
        status: 'active',
        emailSubject: 'Your {appName} profile has been approved',
        headline: 'Welcome to {appName}!',
        body: 'Your application has been approved. You can now sign in, update any remaining details, and begin accepting clients on {appName}.',
        ctaLabel: 'Open Therapist Dashboard',
        ctaPath: '/therapist',
        requiresReason: false,
    },
    reject: {
        status: null, // sentinel — handled by delete path below
        emailSubject: 'Update on your {appName} application',
        headline: 'Application Review Update',
        body: 'After careful review, we are unable to approve your profile at this time. The review notes below explain what needs attention before you can reapply.',
        ctaLabel: 'Start New Application',
        ctaPath: '/login?mode=signup&',
        requiresReason: true,
    },
    terminate: {
        status: 'suspended',
        emailSubject: '{appName} account status change',
        headline: 'Account Access Paused',
        body: 'We have paused your access to {appName} while we address the concern noted below. Please review the details and contact support if you have questions.',
        ctaLabel: 'Go to Login',
        ctaPath: '/login',
        requiresReason: true,
    },
    reinstate: {
        status: 'active',
        emailSubject: 'Your {appName} access has been restored',
        headline: 'Account Reinstated',
        body: 'Your {appName} access has been reinstated. You may sign back in and continue supporting clients immediately.',
        ctaLabel: 'Open Therapist Dashboard',
        ctaPath: '/therapist',
        requiresReason: false,
    },
};
function withAppName(template, appName) {
    return template.replaceAll('{appName}', appName);
}
export async function performTherapistAction({ therapistId, action, reason, }) {
    const supabase = await createClient();
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Psychlink.pro';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@psychlink.pro';
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }
    const { data: adminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
    if (adminRole?.role !== 'admin') {
        return { success: false, error: 'Forbidden' };
    }
    const config = ACTION_CONFIG[action];
    if (!config) {
        return { success: false, error: 'Unsupported action' };
    }
    if (config.requiresReason && (!reason || reason.trim().length < 8)) {
        return { success: false, error: 'Please provide a reason (minimum 8 characters).' };
    }
    // Use service role for admin reads of therapist + auth email
    const admin = createServiceRoleClient();
    const { data: therapistRole } = await admin
        .from('user_roles')
        .select('id, role, status')
        .eq('id', therapistId)
        .maybeSingle();
    if (!therapistRole || therapistRole.role !== 'therapist') {
        return { success: false, error: 'Therapist not found' };
    }
    const { data: therapistProfile } = await admin
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', therapistId)
        .maybeSingle();
    // Lookup auth email via admin api
    let therapistEmail = null;
    try {
        const { data: authUser } = await admin.auth.admin.getUserById(therapistId);
        therapistEmail = authUser?.user?.email ?? null;
    }
    catch (e) {
        console.error('[TherapistAction] auth lookup error', e);
    }
    if (action === 'reject') {
        const { error: deleteError } = await admin.from('user_roles').delete().eq('id', therapistId);
        if (deleteError) {
            console.error('[TherapistAction] Delete error', deleteError);
            return { success: false, error: 'Failed to reject therapist' };
        }
    }
    else {
        const { error: updateError } = await admin
            .from('user_roles')
            .update({ status: config.status })
            .eq('id', therapistId);
        if (updateError) {
            console.error('[TherapistAction] Update error', updateError);
            return { success: false, error: 'Failed to update therapist status' };
        }
    }
    // Log moderation action
    try {
        const { error: logError } = await admin.from('moderation_logs').insert({
            therapist_id: therapistId,
            admin_id: user.id,
            action,
            reason: reason?.trim() || null,
        });
        if (logError)
            throw logError;
    }
    catch (logError) {
        console.error('[TherapistAction] Log error', logError);
    }
    // Send email notification
    if (therapistEmail) {
        try {
            const emailHtml = await render(TherapistDecisionEmail({
                therapistName: therapistProfile?.full_name ?? 'Therapist',
                headline: withAppName(config.headline, appName),
                body: withAppName(config.body, appName),
                reason: reason?.trim(),
                ctaHref: `${appUrl}${config.ctaPath}`,
                ctaLabel: config.ctaLabel,
                supportEmail,
                appName,
            }));
            await emailService.sendEmail({
                to: therapistEmail,
                subject: withAppName(config.emailSubject, appName),
                html: emailHtml,
            });
        }
        catch (emailError) {
            console.error('[TherapistAction] Email error', emailError);
        }
    }
    revalidatePath('/admin/therapists');
    revalidatePath('/admin');
    revalidatePath(`/admin/therapists/${therapistId}`);
    return { success: true };
}
