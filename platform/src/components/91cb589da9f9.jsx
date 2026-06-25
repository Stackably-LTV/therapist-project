import { createClient } from '@/components/9a6b39502e62';
import { redirect } from 'next/navigation';
import TherapistProfileTabs from '@/components/a0b28aa8981a';
import OnboardingBanner from '@/components/32e9d3d5a28d';
import { ChangePasswordCard } from '@/components/c93174eba105';
export const dynamic = 'force-dynamic';
export default async function TherapistProfilePage({ searchParams, }) {
    const supabase = await createClient();
    const params = await searchParams;
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    // Fetch user profile (split across user_roles + user_profiles)
    const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
        supabase.from('user_roles').select('role, status').eq('id', user.id).single(),
        supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
    ]);
    const profile = roleRow
        ? {
            id: user.id,
            role: roleRow.role,
            status: roleRow.status,
            name: profileRow?.full_name ?? '',
            email: user.email ?? '',
            profile_json: (profileRow ?? {}),
            ...(profileRow ?? {}),
        }
        : null;
    const isOnboarding = params.onboarding === 'true';
    const initialTab = params.tab;
    return (<div className="space-y-6">
      {/* Onboarding Banner */}
      {isOnboarding && <OnboardingBanner />}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-4xl font-bold mb-2">
          {isOnboarding ? 'Complete Your Profile' : 'Profile Settings'}
        </h1>
        <p className="text-blue-100 text-lg">
          {isOnboarding
            ? 'Please complete your professional information to get started'
            : 'Manage your professional profile and practice information'}
        </p>
      </div>

      {/* Profile Tabs */}
      <TherapistProfileTabs user={user} profile={profile} isOnboarding={isOnboarding} initialTab={initialTab}/>

      <ChangePasswordCard email={user.email ?? ''}/>
    </div>);
}
