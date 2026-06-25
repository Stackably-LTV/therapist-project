'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient, getUser } from '@/components/9a6b39502e62';
export async function completeSeekerOnboarding(formData) {
    const user = await getUser();
    if (!user) {
        redirect('/login');
    }
    const supabase = await createClient();
    // Verify user has seeker role
    const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
    if (!userRole || userRole.role !== 'seeker') {
        redirect('/login');
    }
    const displayName = String(formData.get('displayName') || '') ||
        user.user_metadata?.name ||
        user.email ||
        'Seeker';
    const pronouns = String(formData.get('pronouns') || '') || null;
    const bio = String(formData.get('bio') || '') || null;
    const phoneE164 = String(formData.get('phone') || '') || null;
    const profileImageUrl = String(formData.get('profileImageUrl') || '') || null;
    // Upsert so seekers whose user_profiles row was never created (legacy signups,
    // manual deletions) still get onboarded instead of silently no-op-ing.
    const { data: upserted, error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
        user_id: user.id,
        full_name: displayName,
        preferred_name: displayName,
        pronouns,
        bio,
        phone_e164: phoneE164,
        profile_image_url: profileImageUrl,
        onboarding_completed: true,
    }, { onConflict: 'user_id' })
        .select('user_id')
        .single();
    if (profileError || !upserted?.user_id) {
        console.error('[completeSeekerOnboarding] Failed to upsert user_profiles', profileError);
        throw new Error(profileError?.message
            ? `Unable to save onboarding: ${profileError.message}`
            : 'Unable to save your onboarding details. Please try again.');
    }
    // Seekers don't need admin approval — flip status to active immediately.
    const { error: roleError } = await supabase
        .from('user_roles')
        .update({ status: 'active' })
        .eq('id', user.id);
    if (roleError) {
        console.error('[completeSeekerOnboarding] Failed to activate user_roles', roleError);
        throw new Error('Unable to save your onboarding details. Please try again.');
    }
    // Link any pending email-invite connection requests for this seeker's email.
    // When a therapist invites a seeker by email and the seeker later registers,
    // we update the connection_requests row to set seeker_id and clear the email-invite fields
    // to satisfy the path CHECK constraint.
    const userEmail = user.email;
    if (userEmail) {
        const { error: linkError } = await supabase
            .from('connection_requests')
            .update({
            seeker_id: user.id,
            seeker_email: null,
            invite_token: null,
        })
            .eq('seeker_email', userEmail)
            .is('seeker_id', null); // Only update rows that haven't already been linked
        if (linkError) {
            console.error('[completeSeekerOnboarding] Failed to link pending invites', linkError);
            // Non-fatal: proceed with onboarding. User can still accept invites manually if needed.
        }
    }
    // Clinical intake (dob, address, emergency contact, demographics) is collected
    // separately — either by the therapist via the Add Patient form, or filled in
    // later by the seeker on a dedicated intake page. Onboarding here only covers
    // the basic profile fields above.
    const redirectToRaw = String(formData.get('redirect') || '');
    const redirectTo = redirectToRaw.startsWith('/') && !redirectToRaw.startsWith('//') ? redirectToRaw : '';
    revalidatePath('/seeker');
    revalidatePath('/seeker/profile');
    revalidatePath('/login');
    if (redirectTo) {
        revalidatePath(redirectTo);
    }
    redirect(redirectTo || '/seeker');
}
