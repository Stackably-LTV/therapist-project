import { createClient } from '@/components/9a6b39502e62';
import { redirect } from 'next/navigation';
export default async function TherapistLayout({ children }) {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role, status')
        .eq('id', user.id)
        .single();
    if (!roleRow || roleRow.role !== 'therapist') {
        redirect(roleRow?.role ? `/${roleRow.role}` : '/login?mode=signup&');
    }
    const { data: profileRow } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();
    if (!profileRow?.onboarding_completed) {
        redirect('/login');
    }
    // Block all therapist dashboard routes until approved.
    if (roleRow.status !== 'active') {
        redirect('/status');
    }
    return children;
}
