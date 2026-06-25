'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient, getUser } from '@/components/9a6b39502e62';
export async function chooseSignupRole(formData) {
    const role = formData.get('role');
    if (role !== 'seeker' && role !== 'therapist') {
        throw new Error('Invalid role selection');
    }
    const redirectToRaw = String(formData.get('redirect') || '');
    const redirectTo = redirectToRaw.startsWith('/') && !redirectToRaw.startsWith('//') ? redirectToRaw : '';
    const user = await getUser();
    if (!user) {
        redirect('/login?error=session_expired');
    }
    const supabase = await createClient();
    // Derive a sane initial full_name. The onboarding step will overwrite it.
    const initialFullName = user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        user.email?.split('@')[0] ||
        (role === 'therapist' ? 'Therapist' : 'Seeker');
    // Insert user_roles row. status='pending' for both — seekers flip to 'active'
    // once onboarding completes; therapists stay pending until admin approval.
    const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
        id: user.id,
        role,
        status: 'pending',
    });
    if (roleError) {
        console.error('[chooseSignupRole] Failed to insert user_roles', roleError);
        redirect('/login?error=role_update_failed');
    }
    // Insert user_profiles row with the required full_name. Other fields filled
    // in during the role-specific onboarding step.
    const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
        user_id: user.id,
        full_name: initialFullName,
        onboarding_completed: false,
    });
    if (profileError) {
        console.error('[chooseSignupRole] Failed to insert user_profiles', profileError);
        redirect('/login?error=role_update_failed');
    }
    // Keep auth metadata.role aligned so admin tooling sees the real role.
    const { error: metadataError } = await supabase.auth.updateUser({
        data: { role },
    });
    if (metadataError) {
        console.error('[chooseSignupRole] Failed to sync auth metadata role', metadataError);
    }
    revalidatePath('/login', 'layout');
    redirect(redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login');
}
